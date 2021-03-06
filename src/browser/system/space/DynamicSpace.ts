import {Entity, Scene} from "aframe";
import {Actuator} from "./Actuator";
import {StateSystemController} from "../state/StateSystemController";
import {getSystemController} from "aframe-typescript-boilerplate";

export class DynamicSpace {

    scene: Scene;
    avatarId: string;
    avatarIndex: number = -1;
    actuatorsMap: Map<string, Map<number, Actuator>> = new Map<string, Map<number, Actuator>>();

    actuatorRemoves: Map<string, Actuator> = new Map();

    constructor(scene: Scene, avatarId: string) {
        this.avatarId = avatarId;
        this.scene = scene;
    }

    connected(region: string) {
        this.actuatorsMap.set(region, new Map<number, Actuator>());
    }

    disconnected(region: string) {
        if (!this.actuatorsMap.has(region)) {
            return;
        }
        this.actuatorsMap.get(region)!!.forEach((value: Actuator, key: number) => {
            value.removed();
        });
        this.actuatorsMap.delete(region);
    }

    added(region: string, index: number, id: string, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number, description: string) : void {
        if (id === this.avatarId) {
            this.avatarIndex = index;
            return;
        }
        if (this.actuatorRemoves.has(id)) {
            // In case of fast reconnect remove actuator from removal set and move actuator to new region.

            const actuator = this.actuatorRemoves.get(id);


            if (actuator) {
                this.actuatorRemoves.delete(id);

                // Change region.
                this.actuatorsMap.get(actuator.region)!!.delete(actuator.index);
                this.actuatorsMap.get(region)!!.set(index, actuator);
                actuator.changeRegion(region, index);

                return;
            }
        }

        const actuators = this.actuatorsMap.get(region);
        if (!actuators) {
            console.log("Region does not have actuators map i.e. client not connected: " + region);
            return;
        }
        if (actuators!!.has(index)) {
            console.log("object already added.");
            return;
        }
        const actuator = new Actuator(this.scene, region, id, index, description);
        actuators!!.set(index, actuator);
        actuator.added(x, y, z, rx, ry, rz, rw);
    }

    updated(region: string, index: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, rw: number) : void {
        if (index === this.avatarIndex) {
            //console.log("dataspace - observed own avatar update.");
            return;
        }
        const actuators = this.actuatorsMap.get(region);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.updated(x, y, z, rx, ry, rz, rw)
    }

    removed(region: string, index: number, id: string) : void {
        if (index == this.avatarIndex) {
            //console.log("dataspace - observed own avatar remove.")
            return;
        }
        const actuators = this.actuatorsMap.get(region);
        if (!actuators) {
            return;
        }
        const actuator = actuators.get(index);
        if (!actuator) {
            return;
        }
        this.actuatorRemoves.set(id, actuator);
        setTimeout(() => {
            if (this.actuatorRemoves.has(id)) {
                this.actuatorRemoves.delete(id);
                const actuators = this.actuatorsMap.get(region);
                if (!actuators) {
                    return;
                }
                const actuator = actuators.get(index);
                if (!actuator) {
                    return;
                }
                actuator!!.removed();
                (getSystemController(this.scene, "state") as StateSystemController).removeStates(actuator.entity);
                actuators.delete(index);
            }
        }, 1000);
    }

    described(region: string, index: number, description: string) : void {
        if (index == this.avatarIndex) {
            return;
        }
        const actuators = this.actuatorsMap.get(region);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.described(description);
    }

    acted(region: string, index: number, action: string, description: string) : void {
        if (index == this.avatarIndex) {
            return;
        }
        const actuators = this.actuatorsMap.get(region);
        if (!actuators) { return; }
        const actuator = actuators.get(index);
        if (!actuator) { return; }
        actuator!!.acted(action, description);
    }

    simulate(t: number) {
        this.actuatorsMap.forEach(((actuators) => {
           actuators.forEach((actuator => {
               actuator.simulate(t);
           }))
        }));
    }

}