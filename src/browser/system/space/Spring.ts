import {Quaternion, Vector3} from "three";

export class Spring {


    relaxationTime: number = 0.45;
    currentPosition: Vector3 = new Vector3();
    targetPosition: Vector3 = new Vector3();
    temporary: Vector3 = new Vector3();

    currentOrientation: Quaternion = new Quaternion();
    targetOrientation: Quaternion = new Quaternion();


    simulate(t: number) {
        if (t > 0.04) {
            t = 0.04;
        }

        // Calculate distance between current position and target position.
        const totalDistance = this.currentPosition.distanceTo(this.targetPosition);
        let v = Math.pow(totalDistance / this.relaxationTime, 2);
        if (v < 0.3) {
            v = 0.3;
        }
        let s = v * t;
        if (s > totalDistance * 0.5) {
            s = totalDistance * 0.5;
        }

        // Calculate normalized direction vector between current position and target position.
        this.temporary.copy(this.targetPosition);
        this.temporary.sub(this.currentPosition).normalize();

        // Calculate delta vector.
        this.temporary.multiplyScalar(s);

        // Add delta to current position-
        this.currentPosition.add(this.temporary);

        // Interpolate orientation change
        this.currentOrientation.slerp(this.targetOrientation, t / this.relaxationTime);
        this.currentOrientation.normalize();

    }

}