import Vue from 'vue'
import Vuex from 'vuex'

import { examples } from "../../example/src/exports";

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    showConfigPanel: false,
    showScenePanel: false,
    examples,
    viewExample: "",
  },
  mutations: {

  },
  actions: {

  }
})
