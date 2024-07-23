import { DocHandle } from "@automerge/automerge-repo";
import { createEffect, createMemo, createSignal, For, Match, onMount, Switch } from "solid-js";
import { MultiProvider } from "@solid-primitives/context";

import { IndexedMap, indexMap } from "../util/indexing";
import { useDoc } from "../util/automerge_solid";

import { ObId } from "catlog-wasm";
import { TheoryId, TheoryMeta } from "../theory";
import { ModelJudgment, MorphismDecl, newMorphismDecl, newObjectDecl, ModelNotebook, ObjectDecl } from "./types";
import { CellActions, CellConstructor, newFormalCell, newRichTextCell, NotebookEditor } from "../notebook";
import { InlineInput } from "../components";
import { ObjectIndexContext, TheoryContext } from "./model_context";
import { ObjectCellEditor } from "./object_cell_editor";
import { MorphismCellEditor } from "./morphism_cell_editor";

import "./model_notebook_editor.css";


/** Editor for a cell in a model of a discrete double theory.
 */
export function ModelCellEditor(props: {
    content: ModelJudgment;
    changeContent: (f: (content: ModelJudgment) => void) => void;
    isActive: boolean;
    actions: CellActions;
}) {
    return (
        <Switch>
        <Match when={props.content.tag === "object"}>
            <ObjectCellEditor
                object={props.content as ObjectDecl}
                modifyObject={(f) => props.changeContent(
                    (content) => f(content as ObjectDecl)
                )}
                isActive={props.isActive} actions={props.actions}
            />
        </Match>
        <Match when={props.content.tag === "morphism"}>
            <MorphismCellEditor
                morphism={props.content as MorphismDecl}
                modifyMorphism={(f) => props.changeContent(
                    (content) => f(content as MorphismDecl)
                )}
                isActive={props.isActive} actions={props.actions}
            />
        </Match>
        </Switch>
    );
}

/** Reference to a `ModelNotebookEditor`.
 */
export type ModelNotebookRef = {
    // Get the current model data.
    model: () => ModelNotebook;

    // Make a change to the model data.
    changeModel: (f: (model: ModelNotebook) => void) => void;

    // Get the double theory that the model is of, if defined.
    theory: () => TheoryMeta | undefined;
}

/** Notebook-based editor for a model of a discrete double theory.
 */
export function ModelNotebookEditor(props: {
    handle: DocHandle<ModelNotebook>;
    init: ModelNotebook;
    theories: Map<TheoryId, TheoryMeta>;
    ref?: (ref: ModelNotebookRef) => void;
}) {
    const [theory, setTheory] = createSignal<TheoryMeta | undefined>();

    const [model, changeModel] = useDoc(() => props.handle, props.init);

    onMount(() => props.ref?.({ model, changeModel, theory }));

    createEffect(() => {
        const id = model().theory;
        setTheory(id !== undefined ? props.theories.get(id) : undefined);
    });

    const objectIndex = createMemo<IndexedMap<ObId,string>>(() => {
        const map = new Map<ObId,string>();
        for (const cell of model().notebook.cells) {
            if (cell.tag == "formal" && cell.content.tag == "object") {
                map.set(cell.content.id, cell.content.name);
            }
        }
        return indexMap(map);
    });

    return (
        <div class="model">
            <div class="model-head">
                <div class="model-title">
                <InlineInput text={model().name}
                    setText={(text) => {
                        changeModel((model) => (model.name = text));
                    }}
                />
                </div>
                <div class="model-theory">
                <select required
                    disabled={model().notebook.cells.some(
                        cell => cell.tag === "formal")}
                    value={model().theory ?? ""}
                    onInput={(evt) => {
                        let id = evt.target.value;
                        changeModel((model) => {
                            model.theory = id ? id : undefined;
                        });
                    }}
                >
                    <option value="" disabled selected hidden>
                        Choose a logic
                    </option>
                    <For each={Array.from(props.theories.values())}>
                    {(theory) =>
                        <option value={theory.id}>
                            {theory.name}
                        </option>}
                    </For>
                </select>
                </div>
            </div>
            <MultiProvider values={[
                [TheoryContext, theory],
                [ObjectIndexContext, objectIndex],
            ]}>
                <NotebookEditor handle={props.handle} path={["notebook"]}
                    notebook={model().notebook}
                    changeNotebook={(f) => {
                        changeModel((model) => f(model.notebook));
                    }}
                    formalCellEditor={ModelCellEditor}
                    cellConstructors={modelCellConstructors(theory())}
                />
            </MultiProvider>
        </div>
    );
}

type ModelCellConstructor = CellConstructor<ModelJudgment>;

function modelCellConstructors(theory?: TheoryMeta): ModelCellConstructor[] {
    // On Mac, the Alt/Option key remaps keys, whereas on other platforms
    // Control tends to be already bound in other shortcuts.
    const modifier = navigator.userAgent.includes("Mac") ? "Control" : "Alt";

    const result: ModelCellConstructor[] = [
        {
            name: "Text",
            description: "Start writing ordinary text",
            shortcut: [modifier, "T"],
            construct: () => newRichTextCell(),
        }
    ];

    for (const typ of theory?.types.values() ?? []) {
        const {name, description, shortcut} = typ;
        result.push({
            name, description,
            shortcut: shortcut && [modifier, ...shortcut],
            construct: typ.tag === "ob_type" ?
                () => newFormalCell(newObjectDecl(typ.obType)) :
                () => newFormalCell(newMorphismDecl(typ.morType)),
        });
    }

    return result;
}
