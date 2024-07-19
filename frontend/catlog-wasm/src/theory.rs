//! Wasm bindings for discrete double theories.

use std::hash::Hash;
use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use tsify_next::Tsify;

use ustr::Ustr;
use catlog::one::fin_category::*;
use catlog::dbl::theory::{self as dbl_theory, DblTheory};

type UstrDiscreteDblThy = dbl_theory::DiscreteDblTheory<UstrFinCategory>;


/** Produce type defs for dependencies supporting `serde` but not `tsify`.

Somewhat amazingly, the type system in TypeScript can express the constraint
that an array be nonempty, with certain usage caveats:

https://stackoverflow.com/q/56006111

For now, though, we will not attempt to enforce this in the TypeScript layer.
 */
#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
export type Ustr = string;
export type NonEmpty<T> = Array<T>;
"#;

// XXX: It seems like tsify should find the following on its own.
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen]
    fn tsFinHom() -> FinHom<Ustr, Ustr>;
}


/// Object type in discrete double theory.
#[derive(Eq, Hash, PartialEq, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ObType(Ustr);

/// Morphism type in discrete double theory.
#[derive(Eq, Hash, PartialEq, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct MorType(FinHom<Ustr, Ustr>);

/** Wasm bindings for a discrete double theory.

Besides being a thin wrapper around the theory from `catlog`, this struct allows
numerical indices to be set for types in the theory, compensating for the lack
of hash maps with arbitrary keys in JavaScript.
*/
#[wasm_bindgen]
pub struct DiscreteDblTheory {
    theory: &'static UstrDiscreteDblThy,
    ob_type_index: HashMap<ObType, usize>,
    mor_type_index: HashMap<MorType, usize>,
}

#[wasm_bindgen]
impl DiscreteDblTheory {
    pub(crate) fn new(theory: &'static UstrDiscreteDblThy) -> DiscreteDblTheory {
        DiscreteDblTheory {
            theory: theory, ob_type_index: Default::default(),
            mor_type_index: Default::default(),
        }
    }

    /// Index of an object type, if set.
    #[wasm_bindgen(js_name = "obTypeIndex")]
    pub fn ob_type_index(&self, x: &ObType) -> Option<usize> {
        self.ob_type_index.get(x).copied()
    }

    /// Index of a morphism type, if set.
    #[wasm_bindgen(js_name = "morTypeIndex")]
    pub fn mor_type_index(&self, m: &MorType) -> Option<usize> {
        self.mor_type_index.get(m).copied()
    }

    /// Set the index of an object type.
    #[wasm_bindgen(js_name = "setObTypeIndex")]
    pub fn set_ob_type_index(&mut self, x: ObType, i: usize) {
        self.ob_type_index.insert(x, i);
    }

    /// Set the index of a morphism type.
    #[wasm_bindgen(js_name = "setMorTypeIndex")]
    pub fn set_mor_type_index(&mut self, m: MorType, i: usize) {
        self.mor_type_index.insert(m, i);
    }

    /// Source of a morphism type.
    #[wasm_bindgen]
    pub fn src(&self, m: MorType) -> ObType {
        ObType(self.theory.src(&m.0))
    }

    /// Target of a morphism type.
    #[wasm_bindgen]
    pub fn tgt(&self, m: MorType) -> ObType {
        ObType(self.theory.tgt(&m.0))
    }
}
