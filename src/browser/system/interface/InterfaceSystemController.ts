import {Component, Entity, Scene, System} from "AFrame";
import {AbstractSystemController} from "../AbstractSystemController";
import {InterfaceController} from "./InterfaceController";
import {DeviceSlot} from "./model/DeviceSlot";
import {Device} from "./Device";
import {ToolSlot} from "./model/ToolSlot";
import {Tool} from "./Tool";
import {Button} from "./model/Button";
import {Stick} from "./model/Stick";
import {SystemControllerDefinition} from "../../AFrame";
import {Object3D} from "three";
import {ComponentController} from "../../component/ComponentController";

export class InterfaceSystemController extends AbstractSystemController {

    public static DEFINITION = new SystemControllerDefinition(
        "interface", {},
        (system: System, scene: Scene, data: any) => new InterfaceSystemController(system, scene, data)
    );


    public interfaceEntity: Entity;
    public cameraEntity: Entity;
    public collidables = new Array<Object3D>();

    private interfaceController: InterfaceController | undefined;

    private devices: Map<DeviceSlot, Device> = new Map();
    private tools: Map<string, Tool> = new Map();
    private toolSlots: Map<ToolSlot, Tool> = new Map();


    constructor(system: System, scene: Scene, data: any) {
        super(system, scene, data);

        this.interfaceEntity = this.scene!!.querySelector('[interface]') as Entity;
        if (this.interfaceEntity) {
            console.info("interface entity set.");
        } else {
            throw new Error("interface entity not found.");
        }

        this.cameraEntity = this.interfaceEntity!!.querySelector('[camera]') as Entity;
        if (this.cameraEntity) {
            console.info("interface camera entity set.");
        } else {
            throw new Error("interface camera entity not found.");
        }

    }

    init(): void {
    }

    pause(): void {
    }

    play(): void {
    }

    tick(time: number, timeDelta: number): void {
    }

    getCollidables(): Array<Object3D> {
        /*if (this.collidables.length == 0) {
            for (let entity of this.scene.children) {
                if (!entity.hasAttribute("interface")) {
                    if ((entity as Entity).object3D) {
                        this.collidables.push((entity as Entity).object3D);
                    }
                }
            }
        }*/
        return this.collidables;
    }

    addCollidable(object: Object3D) {
        this.collidables.push(object);
    }

    removeCollidable(object: Object3D) {
        const index = this.collidables.indexOf(object, 0);
        if (index > -1) {
            this.collidables.splice(index, 1);
        }
    }

    setInterfaceController(interfaceController: InterfaceController) {
        this.interfaceController = interfaceController;
    }

    setDevice(slot: DeviceSlot, device: Device) {
        if (this.devices.has(slot)) {
            console.log("interface already has controls at: " + DeviceSlot[slot]);
        } else {
            this.devices.set(slot, device);
            console.log("interface controls " + device.componentName + " set at: " + DeviceSlot[slot]);
        }
    }

    getDevice(slot: DeviceSlot): Device | undefined {
        return this.devices.get(slot);
    }

    registerTool(tool: Tool) {
        if (!this.tools.has(name)) {
            console.log("interface tool '" + tool.componentName + "' registered.");
            this.tools.set(tool.componentName, tool);
        } else {
            throw new Error("Tool '" + name + "' already registered.");
        }
    }

    getTool<T extends Tool>(name: string): T {
        if (this.tools.has(name)) {
            return this.tools.get(name)! as T;
        } else {
            throw new Error("Tool '" + name + "' not registered.");
        }
    }

    setTool(slot: ToolSlot, tool: Tool) {
        if (this.toolSlots.has(slot)) {
            console.log("interface already has tool at: " + ToolSlot[slot]);
        } else {
            this.toolSlots.set(slot, tool);
            console.log("interface tool " + tool.componentName + " set at: " + ToolSlot[slot]);
        }
    }

    buttonUp(device: Device, toolSlot: ToolSlot,  button: Button) {
        if (this.toolSlots.has(toolSlot)) {
            this.toolSlots.get(toolSlot)!!.buttonUp(device, toolSlot, button);
        }
    }

    buttonDown(device: Device, toolSlot: ToolSlot, button: Button) {
        if (this.toolSlots.has(toolSlot)) {
            this.toolSlots.get(toolSlot)!!.buttonDown(device, toolSlot, button);
        }
    }

    stickTwist(device: Device, toolSlot: ToolSlot, stick: Stick, x: number, y: number) {
        if (this.toolSlots.has(toolSlot)) {
            this.toolSlots.get(toolSlot)!!.stickTwist(device, toolSlot, stick, x, y);
        }
    }

}


