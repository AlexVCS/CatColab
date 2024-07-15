import { createEffect, createSignal, splitProps, useContext } from "solid-js";

import { IndexedMap } from "../util/indexing";
import { ObjectDecl, ObjectId } from "./types";
import { CellActions } from "../notebook";
import { InlineInput, InlineInputOptions } from "../components";
import { TheoryContext } from "./model_context";

import "./object_cell_editor.css";


export function ObjectCellEditor(props: {
    object: ObjectDecl,
    modifyObject: (f: (decl: ObjectDecl) => void) => void;
    isActive: boolean;
    actions: CellActions;
}) {
    let nameRef!: HTMLInputElement;

    createEffect(() => {
        if (props.isActive) {
            nameRef.focus();
            nameRef.selectionStart = nameRef.selectionEnd = nameRef.value.length;
        }
    });

    const theory = useContext(TheoryContext);
    const cssClasses = (): string[] => {
        const typ = props.object.type;
        const list = theory?.()?.types.get(typ)?.cssClasses ?? [];
        return ["object-decl", ...list];
    };

    return <div class={cssClasses().join(" ")}>
        <InlineInput ref={nameRef} placeholder="Unnamed"
            text={props.object.name}
            setText={(text) => {
                props.modifyObject((ob) => (ob.name = text));
            }}
            deleteBackward={props.actions.deleteBackward}
            deleteForward={props.actions.deleteForward}
            exitBackward={props.actions.activateAbove}
            exitForward={props.actions.activateBelow}
            exitUp={props.actions.activateAbove}
            exitDown={props.actions.activateBelow}
            onFocus={props.actions.hasFocused}
        />
    </div>;
}

export function ObjectIdInput(allProps: {
    objectId: ObjectId | null;
    setObjectId: (id: ObjectId | null) => void;
    objectType?: string;
    objectIndex?: IndexedMap<ObjectId,string>;
} & InlineInputOptions) {
    const [props, inputProps] = splitProps(allProps, [
        "objectId", "setObjectId", "objectIndex", "objectType",
    ]);

    const [text, setText] = createSignal("");

    createEffect(() => {
        let name = "";
        if (props.objectId) {
            name = props.objectIndex?.map.get(props.objectId) ?? "";
        }
        setText(name);
    });

    const handleNewText = (text: string) => {
        const possibleIds = props.objectIndex?.index.get(text);
        if (possibleIds && possibleIds.length > 0) {
            // TODO: Warn the user when the names are not unique.
            props.setObjectId(possibleIds[0]);
        } else if (text === "") {
            // To avoid erasing incompletely entered text, only reset the ID
            // to null when the text is also empty.
            props.setObjectId(null);
        }
        setText(text);
    };

    const isValid = () => {
        const objectName = props.objectId ?
            props.objectIndex?.map.get(props.objectId) : "";
        return text() === objectName;
    };

    const theory = useContext(TheoryContext);
    const cssClass = () => {
        const typ = props.objectType;
        return typ && theory?.()?.types.get(typ)?.cssClasses?.join(" ");
    };

    return <div class={cssClass()}>
        <InlineInput text={text()} setText={handleNewText}
            invalid={!isValid()} {...inputProps} />
    </div>;
}
