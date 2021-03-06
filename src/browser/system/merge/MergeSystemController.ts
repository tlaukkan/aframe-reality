import {Entity, Scene, System} from "aframe";
import List = Mocha.reporters.List;
import {MergeData} from "./MergeData";
import {Mesh, Object3D, Vector3} from "three";
import {clearObject3Ds, cloneObject3D, mergeObject3Ds, ObjectMerge, updateObject3Ds} from "../../three/merge_util";
import {LoaderSystemController} from "../loader/LoaderSystemController";
import {AbstractSystemController, SystemControllerDefinition} from "aframe-typescript-boilerplate";

export class MergeSystemController extends AbstractSystemController {

    readonly merges = new Map<Entity, MergeData>();
    startTime = 0;
    loadingRegistered = false;

    public static DEFINITION = new SystemControllerDefinition(
        "merge",
        {},
        (system: System, scene: Scene, data: any) => new MergeSystemController(system, scene, data)
    );

    constructor(system: System, scene: Scene, data: any) {
        super(system, scene, data);

    }

    init(): void {
//        (this.getSystemController("loader-system") as LoaderSystemController).increaseLoadingCounter();
        this.startTime = new Date().getTime();
    }

    pause(): void {
    }

    play(): void {
    }

    tick(time: number, timeDelta: number): void {
        /*const timeMillis = new Date().getTime();
        for (const merge of this.merges.values()) {
            if (merge.lastMergeTimeMillis != 0 && merge.lastModificationTimeMillis > merge.lastMergeTimeMillis && timeMillis - merge.lastModificationTimeMillis > 60000) {
                this.merge(merge);
            }
        }
        */
        let loading = new Date().getTime() - this.startTime < 3000;

        for (const merge of this.merges.values()) {
            if (this.merging ||merge.loadingChildEntities.size > 3 || merge.mergingChildEntities.size > 3) {
                loading = true;
            }
        }
        if (loading) {
            if (!this.loadingRegistered) {
                this.loadingRegistered = true;
                (this.getSystemController("loader-system") as LoaderSystemController).increaseLoadingCounter();
                console.log("merge system increases loading counter.");
            }
        } else {
            if (this.loadingRegistered) {
                (this.getSystemController("loader-system") as LoaderSystemController).decreaseLoadingCounter();
                this.loadingRegistered = false;
                console.log("merge system decreases loading counter.");
            }
        }

    }

    addMerge(mergeEntity: Entity) {
        //console.log("merge added.");
        if (!this.merges.has(mergeEntity)) {
            this.merges.set(mergeEntity, new MergeData(mergeEntity));
        }
    }

    addLoadingMergeChild(mergeEntity: Entity, mergeChildEntity: Entity) {
        ////console.log("merge child loading...");
        if (!this.merges.has(mergeEntity)) {
            this.merges.set(mergeEntity, new MergeData(mergeEntity));
        }
        const merge = this.merges.get(mergeEntity)!!;
        merge.lastModificationTimeMillis = new Date().getTime();
        merge.childEntities.add(mergeChildEntity);
        merge.loadingChildEntities.add(mergeChildEntity);
    }

    setMergeChildLoaded(mergeEntity: Entity, mergeChildEntity: Entity) {
        ////console.log("merge child loaded.");
        const merge = this.merges.get(mergeEntity)!!;
        if (!merge) {
            return;
        }

        merge.loadingChildEntities.delete(mergeChildEntity);
        merge.mergingChildEntities.add(mergeChildEntity);
        if (merge.loadingChildEntities.size > 0) {
            ////console.log("merge child entities still loading: " + merge.loadingChildEntities.size);
            return;
        }

        //console.log("merge child entities loaded.");


        //if (merge.lastMergeTimeMillis == 0) {
        this.merge(merge);
        //}

    }

    merging = false;

    private merge(merge: MergeData) {

        if (this.merging) {
            return;
        }

        this.merging = true;

        //console.log("merging...");

        const startTimeMillis = new Date().getTime();

        // Collect objects to merge.
        this.collectObjectsToMerge(merge).then((objectsToMerge) => {
            merge.mergingChildEntities.clear();

            //console.log("merging object...");
            mergeObject3Ds(merge.objectMerge, objectsToMerge).then(() => {
                if (!merge.group) {
                    merge.group = merge.objectMerge.group;
                    merge.entity.object3D.add(merge.group);
                }

                merge.lastMergeTimeMillis = new Date().getTime();
                //console.log("merge done: " + (new Date().getTime() - startTimeMillis) + " ms.");

                this.merging = false;

//                (this.getSystemController("loader-system") as LoaderSystemController).decreaseLoadingCounter();
            });
        });


    }

    private async collectObjectsToMerge(merge: MergeData) {
        const objectsToMerge = new Array<Object3D>();
        //console.log("collecting objects to merge from child entities: " + merge.mergingChildEntities.size);
        for (const entity of merge.mergingChildEntities) {
            const clone = await this.cloneObjectToMergeWithWait(entity, merge);
            objectsToMerge.push(clone);
        }
        return objectsToMerge;
    }

    niceTimeoutCounter = 0;

    private cloneObjectToMergeWithWait(entity: Entity, merge: MergeData) : Promise<Object3D> {
        return new Promise((resolve, reject) => {
            const originalObject = entity.object3D;
            this.allocateMergeObjectIndex(merge.objectMerge, originalObject);
            originalObject.visible = false;
            const clone = this.cloneAndSwitchToRegionCoordinates(originalObject, merge);

            this.niceTimeoutCounter++;
            if (this.niceTimeoutCounter % 25 == 0) {
                setTimeout(() => {
                    resolve(clone);
                }, 1);
            } else {
                resolve(clone);
            }

        });
    }


    private allocateMergeObjectIndex(objectMerge: ObjectMerge, object: Object3D) {
        object.userData.mergeObjectIndex = objectMerge.objectOffset;
        objectMerge.objectOffset++;

        if (object.children) {
            for (const child of object.children) {
                this.allocateMergeObjectIndex(objectMerge, child);
            }
        }

    }

    private remove(merge: MergeData) {
        const startTimeMillis = new Date().getTime();
        merge.lastMergeTimeMillis = startTimeMillis;

        //console.log("removing from merge...");
        //console.log("child entities to remove size: " + merge.removingChildEntities.size);

        // Collect objects to merge.
        const objectsToRemove = new Array<Object3D>();
        for (const entity of merge.removingChildEntities) {
            const originalObject = entity.object3D;
            originalObject.visible = true;
            objectsToRemove.push(originalObject);
        }
        merge.removingChildEntities.clear();

        clearObject3Ds(merge.objectMerge, objectsToRemove).then(() => {
            //console.log("removing from merge done: " + (new Date().getTime() - startTimeMillis) + " ms.");
        });
    }

    private update(merge: MergeData) {
        const startTimeMillis = new Date().getTime();
        merge.lastMergeTimeMillis = startTimeMillis;

        //console.log("updating merge...");
        //console.log("child entities to update size: " + merge.updatingChildEntities.size);

        // Collect objects to merge.
        const objectsToUpdate = new Array<Object3D>();
        for (const entity of merge.updatingChildEntities) {
            const originalObject = entity.object3D;
            const objectToMerge = this.cloneAndSwitchToRegionCoordinates(originalObject, merge);

            objectsToUpdate.push(objectToMerge);
        }
        merge.updatingChildEntities.clear();

        updateObject3Ds(merge.objectMerge, objectsToUpdate).then(() => {
            //console.log("updating merge done: " + (new Date().getTime() - startTimeMillis) + " ms.");
        });
    }

    private cloneAndSwitchToRegionCoordinates(object: Object3D, merge: MergeData) {
// Clone object to merge and setup coordinates.
        //const objectToMerge = originalObject;
        const clone = cloneObject3D(object);

        // Transfer to world coordinates as clone does not have parent

        // get world position
        let position = new Vector3();
        object.updateMatrixWorld(true)
        position.setFromMatrixPosition(object.matrixWorld);

        // convert to merge entity world local coordinates
        merge.entity.object3D.updateMatrixWorld(true)
        position = merge.entity.object3D.worldToLocal(position);

        clone.position.x = position.x;
        clone.position.y = position.y;
        clone.position.z = position.z;
        return clone;
    }

    removeMergeChild(mergeEntity: Entity, mergeChildEntity: Entity) {
        ////console.log("merge child remove.");
        if (this.merges.has(mergeEntity)) {
            const merge = this.merges.get(mergeEntity)!!;
            merge.childEntities.delete(mergeChildEntity);
            merge.loadingChildEntities.delete(mergeChildEntity);
            merge.removingChildEntities.add(mergeChildEntity);
            this.remove(merge);
        }
    }

    updateMergeChild(mergeEntity: Entity, mergeChildEntity: Entity) {
        ////console.log("merge child remove.");
        if (this.merges.has(mergeEntity)) {
            const merge = this.merges.get(mergeEntity)!!;
            merge.updatingChildEntities.add(mergeChildEntity);
            this.update(merge);
        }
    }

    removeMerge(mergeEntity: Entity) {
        //console.log("merge remove.");

        const merge = this.merges.get(mergeEntity)!!;

        if (merge) {
            this.merges.delete(mergeEntity);

            // Remove old merge object.
            if (merge.group) {
                merge.entity.object3D.remove(merge.group);
            }
        }
    }
}


