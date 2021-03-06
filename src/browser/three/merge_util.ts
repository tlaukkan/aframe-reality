import {BufferAttribute, BufferGeometry, BufferGeometryUtils, Group, Material, Mesh, Object3D} from "three";
import {
    BufferGeometryMerge,
    clearBufferGeometries,
    mergeBufferGeometries,
    updateBufferGeometries
} from "./geometry_merge_util";

export class ObjectMerge {

    group: Group = new Group();
    geometryMerges: Map<string, BufferGeometryMerge> = new Map();

    objectOffset = 0;
}

export async function mergeObject3Ds(merge: ObjectMerge, objects: Array<Object3D>): Promise<void> {
    const geometryDataMap = new Map<string, Array<GeometryData>>();
    for (const object of objects) {
        await collectBufferGeometries(merge, object, geometryDataMap);
    }

    const allGeometryIds: Set<string> = new Set();
    for (const geometryId of geometryDataMap.keys()) {
        allGeometryIds.add(geometryId);
    }

    for (const geometryId of merge.geometryMerges.keys()) {
        allGeometryIds.add(geometryId);
    }

    for (const geometryId of allGeometryIds) {

        const geometries = new Array<BufferGeometry>();

        const geometryDataArray = geometryDataMap.get(geometryId);
        if (geometryDataArray) {
            //console.log(geometryId + ": " + geometryDataMap.get(geometryId)!!.length);
            const material = geometryDataArray[0].material;
            for (const geometryData of geometryDataArray) {
                geometries.push(geometryData.geometry);
            }
            if (!merge.geometryMerges.has(geometryId)) {
                //console.log("adding geometry merge: " + geometryId);
                const geometryMerge = new BufferGeometryMerge(material);
                merge.geometryMerges.set(geometryId, geometryMerge);
                const mesh = new Mesh(geometryMerge.geometry, geometryMerge.material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                merge.group.add(mesh);
            }
        }

        const geometryMerge = merge.geometryMerges.get(geometryId)!!;
        await mergeBufferGeometries(geometryMerge, geometries, false);
    }
}

export async function clearObject3Ds(merge: ObjectMerge, objects: Array<Object3D>): Promise<void> {
    const geometryDataMap = new Map<string, Array<GeometryData>>();

    // TODO Optimize this for clearing so that geometries are not cloned.
    for (const object of objects) {
        await collectBufferGeometries(merge, object, geometryDataMap);
    }

    for (const geometryId of geometryDataMap.keys()) {

        const geometries = new Array<BufferGeometry>();

        const geometryDataArray = geometryDataMap.get(geometryId);
        if (geometryDataArray) {
            for (const geometryData of geometryDataArray) {
                geometries.push(geometryData.geometry);
            }
        }

        clearBufferGeometries(merge.geometryMerges.get(geometryId)!!, geometries);
    }
}

export async function updateObject3Ds(merge: ObjectMerge, objects: Array<Object3D>): Promise<void> {
    const geometryDataMap = new Map<string, Array<GeometryData>>();

    for (const object of objects) {
        await collectBufferGeometries(merge, object, geometryDataMap);
    }

    for (const geometryId of geometryDataMap.keys()) {

        const geometries = new Array<BufferGeometry>();

        const geometryDataArray = geometryDataMap.get(geometryId);
        if (geometryDataArray) {
            for (const geometryData of geometryDataArray) {
                geometries.push(geometryData.geometry);
            }
        }

        updateBufferGeometries(merge.geometryMerges.get(geometryId)!!, geometries);
    }
}

class GeometryData {
    geometry: BufferGeometry;
    material: Material | Material [];


    constructor(geometry: BufferGeometry, material: Material | Material []) {
        this.geometry = geometry;
        this.material = material;
    }
}


async function collectChildBufferGeometries(merge: ObjectMerge, children: Object3D[], geometries: Map<string, Array<GeometryData>>) {
    for (const child of children) {
        await collectBufferGeometriesWithDelay(merge, child, geometries);
    }
}

let niceTimeoutCounter = 0;

function collectBufferGeometriesWithDelay(merge: ObjectMerge, object: Object3D, geometries: Map<string, Array<GeometryData>>) {
    return new Promise(function (resolve, reject) {
        collectBufferGeometries(merge, object, geometries).then(() => {
            niceTimeoutCounter++;
            if (niceTimeoutCounter % 50 == 0) {
                setTimeout(() => {
                    resolve();
                }, 1);
            } else {
                resolve();
            }
        }).catch((error) => {
            reject(error)
        });
    });
}

async function collectBufferGeometries(merge: ObjectMerge, object: Object3D, geometries: Map<string, Array<GeometryData>>) {
    //console.log("collecting buffer geometries...");
    object.updateMatrix();
    object.updateMatrixWorld(true);
    //console.log(child.type);
    if (object.type == "Mesh") {
        const mesh = object as Mesh;
        const geometryUuid = mesh.geometry.uuid;
        const geometry = mesh.geometry.clone();
        if (object.userData.mergeObjectIndex === undefined) {
            throw new Error("Merge object index of merging object is undefined.");
        }
        (geometry as any).mergeObjectIndex = object.userData.mergeObjectIndex;

        if (geometry.type == "BufferGeometry") {
            const bufferGeometry = geometry as BufferGeometry;
            const material = mesh.material;

            geometry.applyMatrix(mesh.matrixWorld);

            if (!geometries.has(geometryUuid)) {
                geometries.set(geometryUuid, []);
            }
            geometries.get(geometryUuid)!!.push(new GeometryData(bufferGeometry, material));
        }
    }

    if (object.children && object.children.length > 0) {
        await collectChildBufferGeometries(merge, object.children, geometries);
    }
}

export function cloneObject3D(source: Object3D) {

    const target = cloneObject3DCore(source);

    target.name = source.name;
    target.up.copy( source.up );
    target.position.copy( source.position );
    target.quaternion.copy( source.quaternion );
    target.scale.copy( source.scale );
    target.matrix.copy( source.matrix );
    target.matrixWorld.copy( source.matrixWorld );
    target.matrixAutoUpdate = source.matrixAutoUpdate;
    target.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
    target.layers.mask = source.layers.mask;
    target.visible = source.visible;
    target.castShadow = source.castShadow;
    target.receiveShadow = source.receiveShadow;
    target.frustumCulled = source.frustumCulled;
    target.renderOrder = source.renderOrder;
    target.userData = JSON.parse( JSON.stringify( source.userData ) );

    for ( let i = 0; i < source.children.length; i ++ ) {
        const child = source.children[ i ];
        target.add(cloneObject3D(child));
    }

    return target;

}

function cloneObject3DCore(source: Object3D): Object3D {
    if (source.type == "Mesh") {
        const target = new Mesh((source as Mesh).geometry, (source as Mesh).material);
        Object3D.prototype.clone.call(source, target);
        return target;
    } else {
        return new (source as any).constructor();
    }
}

