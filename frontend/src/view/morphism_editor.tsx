import { createEffect } from "solid-js";

import { IndexedMap } from "../util/indexed_map";
import { MorphismDecl, ObjectId } from "../model/model_judgments";
import { CellActions } from "./notebook_editor";
import { ObjectIdInput} from "./object_editor";
import { InlineInput } from "./input";

import "./morphism_editor.css";


export function MorphismDeclEditor(props: {
    morphism: MorphismDecl;
    modifyMorphism: (f: (decl: MorphismDecl) => void) => void;
    isActive: boolean;
    actions: CellActions;
    objectNameMap: IndexedMap<ObjectId,string>;
}) {
    let nameRef!: HTMLInputElement;
    let domRef!: HTMLInputElement;
    let codRef!: HTMLInputElement;

    createEffect(() => {
        props.isActive && nameRef.focus();
    });

    return <div class="morphism-decl">
        <ObjectIdInput ref={domRef} placeholder="..."
            objectId={props.morphism.dom}
            setObjectId={(id) => {
                props.modifyMorphism((mor) => (mor.dom = id));
            }}
            objectNameMap={props.objectNameMap}
            deleteForward={() => nameRef.focus()}
            exitRight={() => nameRef.focus()}
        />
        <div class="morphism-decl-name-container">
        <div class="morphism-decl-name">
        <InlineInput ref={nameRef} placeholder="Unnamed"
            text={props.morphism.name}
            setText={(text) => {
                props.modifyMorphism((mor) => (mor.name = text));
            }}
            deleteBackward={props.actions.deleteBackward}
            deleteForward={props.actions.deleteForward}
            exitUp={props.actions.activateAbove}
            exitDown={props.actions.activateBelow}
            exitLeft={() => domRef.focus()}
            exitRight={() => codRef.focus()}
        />
        </div>
        <div class="morphism-decl-arrow"></div>
        </div>
        <ObjectIdInput ref={codRef} placeholder="..."
            objectId={props.morphism.cod}
            setObjectId={(id) => {
                props.modifyMorphism((mor) => (mor.cod = id));
            }}
            objectNameMap={props.objectNameMap}
            deleteBackward={() => nameRef.focus()}
            exitLeft={() => nameRef.focus()}
        />
    </div>;
}
