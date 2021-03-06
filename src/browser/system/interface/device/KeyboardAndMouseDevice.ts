import {Component, Entity} from "aframe";
import {DeviceSlot} from "../model/DeviceSlot";
import {Device} from "../Device";
import {Slot} from "../model/Slot";
import {Button} from "../model/Button";
import {AddObjectTool} from "../../../..";
import {js2xml, xml2js} from "xml-js";
import {ComponentControllerDefinition} from "aframe-typescript-boilerplate";
import {addDocumentEventListener} from "aframe-typescript-boilerplate";
import {CodeRealityComponentController} from "../../../component/CodeRealityComponentController";
import {UiSystemController} from "../../ui/UiSystemController";

export class KeyboardAndMouseDevice extends CodeRealityComponentController implements Device {

    public static DEFINITION = new ComponentControllerDefinition("keyboard-and-mouse", {}, false, false, (component: Component, entity: Entity, data: any) => new KeyboardAndMouseDevice(component, entity, data));

    movementForwardKey: string = 'w';
    movementBackwardKey: string = 's';
    movementLeftKey: string = 'a';
    movementRightKey: string = 'd';
    jumpKey: string = ' ';

    rightKey = 'ArrowRight';
    leftKey = 'ArrowLeft';
    upKey = 'ArrowUp';
    downKey = 'ArrowDown';

    pointerLock: boolean = false;
    lastWheelYTimeMillis = 0;


    constructor(component: Component, entity: Entity, data: any) {
        super(component, entity, data);

        this.interface.setDevice(DeviceSlot.KEYBOARD_AND_MOUSE, this);
    }

    init(): void {
        //console.log(this.componentName + " init");

        addDocumentEventListener("pointerlockchange", (detail: any) => {
            this.pointerLock = (document as any).pointerLockElement != null;
        });

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (this.interface.isUiFocus()) {
                return;
            }

            this.onKeyDown(e.key);
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            if (this.interface.isUiFocus()) {
                return;
            }

            this.onKeyUp(e.key);
        });

        (this.entity.sceneEl!! as any).addEventListener('mousedown', (e: MouseEvent) => {
            if (!this.pointerLock) {
                return;
            }
            if (this.interface.isUiFocus()) {
                return;
            }


            if (e.button == 0) {
                this.interface.buttonDown(this, Slot.PRIMARY, Button.TRIGGER);
            }
            if (e.button == 1) {
                this.interface.buttonDown(this, Slot.PRIMARY, Button.MENU);
            }
            if (e.button == 2) {
                this.interface.buttonDown(this, Slot.PRIMARY, Button.GRIP);
            }
        });

        (this.entity.sceneEl!! as any).addEventListener('mouseup', (e: MouseEvent) => {
            if (!this.pointerLock) {
                return;
            }
            if (e.button == 0) {
                this.interface.buttonUp(this, Slot.PRIMARY, Button.TRIGGER);
            }
            if (e.button == 1) {
                this.interface.buttonUp(this, Slot.PRIMARY, Button.MENU);
            }
            if (e.button == 2) {
                this.interface.buttonUp(this, Slot.PRIMARY, Button.GRIP);
            }
        });

        window.addEventListener("paste", (event: any) => {
            if (this.interface.isUiFocus()) {
                return;
            }

            if (this.pointerLock) {
                for (const item of event.clipboardData.items) {
                    const itemTyped = item as DataTransferItem;
                    if (itemTyped.kind == "string") {
                        itemTyped.getAsString((pasteString) => {
                            try {
                                const pasteXml = js2xml(xml2js(pasteString));
                                if (!pasteXml.startsWith("<html>")) {
                                    console.log(pasteXml);
                                    const addObjectTool = this.interface.getTool("add-object-tool") as AddObjectTool;
                                    addObjectTool.addEntityFromXml(pasteString);
                                }
                            } catch (error) {
                                console.error("Error copy paste adding an object.", error);
                            }
                        });
                        return;
                    }
                }
            }
            // do something with url here
        });

        /*(this.entity.sceneEl!! as any).addEventListener('click', (e: MouseEvent) => {
            console.log('mouse click ' + e.button);
        });

        */

        /*(this.entity.sceneEl!! as any).addEventListener('wheel', (e: WheelEvent) => {
            console.log('wheel: x=' + e.deltaX + ', y=' + e.deltaY + ', z=' + e.deltaZ);

            if (new Date().getTime() - this.lastWheelYTimeMillis > 1000) {

                if (e.deltaY != 0) {
                    if (e.deltaY > 0) {
                        this.interface.buttonDown(this, Slot.PRIMARY, Button.UP);
                        this.interface.buttonUp(this, Slot.PRIMARY, Button.UP);
                    } else {
                        this.interface.buttonDown(this, Slot.PRIMARY, Button.DOWN);
                        this.interface.buttonUp(this, Slot.PRIMARY, Button.DOWN);
                    }

                    this.lastWheelYTimeMillis = new Date().getTime();
                }
            }
        });*/

    }

    update(data: any, oldData: any): void {
    }

    remove(): void {
    }

    pause(): void {
    }

    play(): void {
    }

    tick(time: number, timeDelta: number): void {
    }

    onKeyDown(key: string) {

        if (key == this.movementForwardKey) {
            this.interface.buttonDown(this, Slot.WALK, Button.UP);
        }
        if (key == this.movementBackwardKey) {
            this.interface.buttonDown(this, Slot.WALK, Button.DOWN);
        }
        if (key == this.movementLeftKey) {
            this.interface.buttonDown(this, Slot.WALK, Button.LEFT);
        }
        if (key == this.movementRightKey) {
            this.interface.buttonDown(this, Slot.WALK, Button.RIGHT);
        }
        if (key == this.jumpKey) {
            this.interface.buttonDown(this, Slot.WALK, Button.TRIGGER);
        }

        if (key == this.upKey || key == 'r') {
            this.interface.buttonDown(this, Slot.PRIMARY, Button.UP);
        }
        if (key == this.downKey || key == 'f') {
            this.interface.buttonDown(this, Slot.PRIMARY, Button.DOWN);
        }
        if (key == this.rightKey || key == 'e') {
            this.interface.buttonDown(this, Slot.PRIMARY_SELECTOR, Button.RIGHT);
        }
        if (key == this.leftKey || key == 'q') {
            this.interface.buttonDown(this, Slot.PRIMARY_SELECTOR, Button.LEFT);
        }

    }

    onKeyUp(key: string) {

        if (key == this.movementForwardKey) {
            this.interface.buttonUp(this, Slot.WALK, Button.UP);
        }
        if (key == this.movementBackwardKey) {
            this.interface.buttonUp(this, Slot.WALK, Button.DOWN);
        }
        if (key == this.movementLeftKey) {
            this.interface.buttonUp(this, Slot.WALK, Button.LEFT);
        }
        if (key == this.movementRightKey) {
            this.interface.buttonUp(this, Slot.WALK, Button.RIGHT);
        }
        if (key == this.jumpKey) {
            this.interface.buttonUp(this, Slot.WALK, Button.TRIGGER);
        }

        if (key == this.upKey || key == 'r') {
            this.interface.buttonUp(this, Slot.PRIMARY, Button.UP);
        }
        if (key == this.downKey || key == 'f') {
            this.interface.buttonUp(this, Slot.PRIMARY, Button.DOWN);
        }
        if (key == this.rightKey || key == 'e') {
            this.interface.buttonUp(this, Slot.PRIMARY_SELECTOR, Button.RIGHT);
        }
        if (key == this.leftKey || key == 'q') {
            this.interface.buttonUp(this, Slot.PRIMARY_SELECTOR, Button.LEFT);
        }

        if (key == 'o') {
            const uiSystem = this.getSystemController("ui") as UiSystemController;
            uiSystem.pushView("<a-example-view/>");
        }
        if (key == 'i') {
            const uiSystem = this.getSystemController("ui") as UiSystemController;
            uiSystem.popView();
        }

    }


}


