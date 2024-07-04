import { createMemo, JSX, onMount, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { IndexedMap, indexMap } from "../model/indexed_map";
import { ModelJudgment, MorphismDecl, ObjectDecl, ObjectId } from "../model/model_judgments";
import { Notebook } from "../model/notebook";
import { NotebookEditor } from "./notebook_editor";
import { InlineInput } from "./input";

import "./model_editor.css";


function ObjectDeclEditor(props: {
    object: ObjectDecl,
    modifyObject: (f: (decl: ObjectDecl) => void) => void;
    deleteSelf: () => void;
}) {
    let nameRef!: HTMLInputElement;
    onMount(() => nameRef.focus());

    return <div class="model-judgment object-declaration">
        <InlineInput ref={nameRef} placeholder="Unnamed"
            value={props.object.name}
            onInput={(evt) => {
                props.modifyObject((ob) => (ob.name = evt.target.value));
            }}
            onKeyDown={(evt) => {
                if (evt.key == "Backspace" && props.object.name == "") {
                    props.deleteSelf();
                }
            }}
        />
    </div>;
}

function ObjectIdEditor(allProps: {
    objectId: ObjectId | null;
    setObjectId: (id: ObjectId | null) => void;
    objectNameMap: IndexedMap<ObjectId,string>;
} & JSX.InputHTMLAttributes<HTMLInputElement>) {
    const [props, inputProps] = splitProps(allProps, [
        "objectId", "setObjectId", "objectNameMap",
    ]);

    const objectName = (): string => {
        let name = "";
        if (props.objectId) {
            name = props.objectNameMap.map.get(props.objectId) || "";
        }
        return name;
    }

    return <InlineInput value={objectName()}
        onInput={(evt) => {
            let id = null;
            const possibleIds = props.objectNameMap.index.get(evt.target.value);
            if (possibleIds && possibleIds.length > 0) {
                id = possibleIds[0];
            }
            props.setObjectId(id);
        }}
        {...inputProps}
    />;
}

function MorphismDeclEditor(props: {
    morphism: MorphismDecl;
    modifyMorphism: (f: (decl: MorphismDecl) => void) => void;
    deleteSelf: () => void;
    objectNameMap: IndexedMap<ObjectId,string>;
}) {
    let nameRef!: HTMLInputElement;
    let domRef!: HTMLInputElement;
    let codRef!: HTMLInputElement;
    onMount(() => nameRef.focus());

    return <div class="model-judgment morphism-declaration">
        <InlineInput ref={nameRef} placeholder="Unnamed"
            value={props.morphism.name}
            onInput={(evt) => {
                props.modifyMorphism((mor) => (mor.name = evt.target.value));
            }}
            onKeyDown={(evt) => {
                if (evt.key == "Backspace" && props.morphism.name == "") {
                    props.deleteSelf();
                }
            }}
        />
        <span>:</span>
        <ObjectIdEditor ref={domRef} placeholder="..."
            objectId={props.morphism.dom}
            setObjectId={(id) => {
                props.modifyMorphism((mor) => (mor.dom = id));
            }}
            objectNameMap={props.objectNameMap}
        />
        <span>&LongRightArrow;</span>
        <ObjectIdEditor ref={codRef} placeholder="..."
            objectId={props.morphism.cod}
            setObjectId={(id) => {
                props.modifyMorphism((mor) => (mor.cod = id));
            }}
            objectNameMap={props.objectNameMap}
        />
    </div>;
}

function ModelJudgmentEditor(props: {
    content: ModelJudgment;
    modifyContent: (f: (content: ModelJudgment) => void) => void;
    deleteSelf: () => void;
    objectNameMap: IndexedMap<ObjectId,string>;
}) {
    const editors = {
        object: () => <ObjectDeclEditor
            object={props.content as ObjectDecl}
            modifyObject={(f) => props.modifyContent(
                (content) => f(content as ObjectDecl)
            )}
            deleteSelf={props.deleteSelf}
        />,
        morphism: () => <MorphismDeclEditor
            morphism={props.content as MorphismDecl}
            modifyMorphism={(f) => props.modifyContent(
                (content) => f(content as MorphismDecl)
            )}
            deleteSelf={props.deleteSelf}
            objectNameMap={props.objectNameMap}
        />,
    };
    return <Dynamic component={editors[props.content.tag]} />;
}

export function ModelEditor(props: {
    notebook: Notebook<ModelJudgment>;
    modifyNotebook: (f: (d: Notebook<ModelJudgment>) => void) => void;
}) {
    const objectNameMap = createMemo<IndexedMap<ObjectId,string>>(() => {
        const map = new Map<ObjectId,string>();
        for (const cell of props.notebook.cells) {
            if (cell.tag == "formal" && cell.content.tag == "object") {
                map.set(cell.content.id, cell.content.name);
            }
        }
        return indexMap(map);
    });

    return (
        <NotebookEditor notebook={props.notebook}
            modifyNotebook={props.modifyNotebook}
            formalCellEditor={ModelJudgmentEditor}
            objectNameMap={objectNameMap()}/>
    );
}
