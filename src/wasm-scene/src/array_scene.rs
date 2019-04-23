use wasm_bindgen::prelude::*;
use crate::math::*;

#[wasm_bindgen]
pub struct ArraySceneAllocationProtocal{
  pub local_transform_array_start: *const f32,
  pub local_position_array_start: *const f32,
  pub world_transform_array_start: *const f32,
  pub world_aabb_array_start: *const f32,
  pub world_bsphere_array_start: *const f32,

  pub nodes_indexs_start: *const i16,
}

#[wasm_bindgen]
pub struct ArrayScene{
  local_transform_array: Vec<f32>,
  local_position_array: Vec<f32>,

  world_transform_array: Vec<f32>,
  world_aabb_array: Vec<f32>,
  world_bsphere_array: Vec<f32>,

  empty_array: Vec<u8>,
  empty_list_array: Vec<u16>,
  empty_count: u16,

  // [parent, left brother, right brother, first child]
  nodes_indexs: Vec<i16>,
}

pub const DEFAULT_NODE_CAPACITY: usize = 100;
pub const TRANSFORM_ARRAY_STRIDE: usize = 16;
pub const POSITION_ARRAY_STRIDE: usize = 3;
pub const WORLD_AABB_ARRAY_STRIDE: usize = 12;
pub const WORLD_BSPHERE_ARRAY_STRIDE: usize = 4;
pub const NODE_INDEX_STRIDE: usize = 4;


#[wasm_bindgen]
impl ArrayScene {
  pub fn new() -> ArrayScene {
    ArrayScene {
      local_transform_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY * TRANSFORM_ARRAY_STRIDE),
      local_position_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY * POSITION_ARRAY_STRIDE),
      world_transform_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY * TRANSFORM_ARRAY_STRIDE),
      world_aabb_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY * WORLD_AABB_ARRAY_STRIDE),
      world_bsphere_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY * WORLD_BSPHERE_ARRAY_STRIDE),

      empty_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY),
      empty_list_array: Vec::with_capacity(DEFAULT_NODE_CAPACITY),
      empty_count: 0,

      nodes_indexs: Vec::with_capacity(DEFAULT_NODE_CAPACITY * NODE_INDEX_STRIDE),
    }
  }

  #[wasm_bindgen]
  pub fn allocate(&mut self, capacity: usize) -> ArraySceneAllocationProtocal{
    // self.local_transform_array = Vec::with_capacity(capacity * TRANSFORM_ARRAY_STRIDE);
    self.local_transform_array =  vec![0.0; capacity * TRANSFORM_ARRAY_STRIDE];
    self.local_position_array =  vec![0.0; capacity * POSITION_ARRAY_STRIDE];
    self.world_transform_array =  vec![0.0; capacity * TRANSFORM_ARRAY_STRIDE];
    self.world_aabb_array =  vec![0.0; capacity * WORLD_AABB_ARRAY_STRIDE];
    self.world_bsphere_array =  vec![0.0; capacity * WORLD_BSPHERE_ARRAY_STRIDE];

    self.empty_array = vec![0; capacity];
    self.empty_list_array = vec![0; capacity];

    self.nodes_indexs = vec![0; capacity];

    ArraySceneAllocationProtocal{
      local_transform_array_start: self.local_transform_array.as_ptr(),
        local_position_array_start: self.local_position_array.as_ptr(),
        world_transform_array_start: self.world_transform_array.as_ptr(),
        world_aabb_array_start: self.world_aabb_array.as_ptr(),
        world_bsphere_array_start: self.world_bsphere_array.as_ptr(),

        nodes_indexs_start: self.nodes_indexs.as_ptr(),
    }
  }

  #[wasm_bindgen]
  pub fn batch_renderlist(&mut self){
    self.update_hirerachy();
  }

  fn traverse_from(&mut self, index: i16, 
  visitor: &Fn(i16, &mut ArrayScene) -> () 
  ){
    let mut travers_stack: Vec<i16> = Vec::with_capacity(100);
    travers_stack.push(index);
    while travers_stack.len() != 0 {
      
      let node_to_visit = travers_stack.pop().unwrap();
      visitor(node_to_visit, self);

      // add childs to stack
      let first_child = self.nodes_indexs[(index as usize) + 3];
      if first_child != -1 { // has more children
        travers_stack.push(first_child);
        let current_child = first_child;
        loop {
          let next_child = self.nodes_indexs[(current_child as usize) + 2];
          if next_child != -1 {
            travers_stack.push(next_child);
          } else {
            break
          }
        }
      }

    }
  }

  fn update_hirerachy(&mut self){
    self.traverse_from(0, &update_hirerachy_visitor)
  }

}

fn update_hirerachy_visitor(index: i16, scene: &mut ArrayScene){
  // update_localmatrix(
  //   index, 
  //   &scene.local_position_array,
  //   &scene.local_rotation_array,
  //   &scene.local_scale_array,
  // );
  update_worldmatrix_by_parent(
    index, 
    &scene.nodes_indexs,
    &scene.local_transform_array,
    &mut scene.world_transform_array,
  );
}
