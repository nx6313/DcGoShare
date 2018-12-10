import Vue from 'vue'
import App from './App.vue'
import ComFun from '@/utils/comfun.js'

Vue.config.productionTip = false
Vue.use(ComFun)

new Vue({
  render: h => h(App),
}).$mount('#app')
