
import { Controller } from "./controller";
import { Nullable } from "@artgl/shared";
import { Plane } from "@artgl/math";
import { Interactor } from "./interactor";
import { SceneNode } from "../scene-node";

export class TransformController extends Controller  {
  reloadStates(): void {
    throw new Error("Method not implemented.");
  }
  update(): void {
    throw new Error("Method not implemented.");
  }

  public registerInteractor(interactor: Interactor) {
    if (this.interactor !== null) {
      this.interactor.unbindControllerAllListener(this);
    }
    this.interactor = interactor;
    this.interactor.bindLeftMouseMove(this, this.moveCursorTo);
    this.interactor.bindMouseUp(this, this.release);
  }

  controlledNode: Nullable<SceneNode> = null;
  restrictPlane: Plane = new Plane();

  select(node: SceneNode) {
    this.controlledNode = node;
  }

  moveCursorTo() {
    if (this.controlledNode === null) {
      return;
    }
  }

  release() {
    this.controlledNode = null;
  }

  
}