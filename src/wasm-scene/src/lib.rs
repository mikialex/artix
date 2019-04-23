mod array_scene;
mod math;
mod utils;

use wasm_bindgen::prelude::*;
extern crate nalgebra as na;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
  fn alert(s: &str);

  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);

  #[wasm_bindgen(js_namespace = console, js_name = log)]
  fn log_f32(s: f32);
}

#[wasm_bindgen]
pub fn greet() {
  alert("Hello, wasm-scene!");
}
