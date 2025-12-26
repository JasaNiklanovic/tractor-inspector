import { createRouter, createWebHistory } from 'vue-router'
import TractorList from '@/views/TractorList.vue'
import TractorDetail from '@/views/TractorDetail.vue'
import EditSession from '@/views/EditSession.vue'
import TractorMap from '@/views/TractorMap.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TractorList
    },
    {
      path: '/tractors/:serialNumber',
      name: 'tractor-detail',
      component: TractorDetail
    },
    {
      path: '/tractors/:serialNumber/edit/:id',
      name: 'edit-session',
      component: EditSession
    },
    {
      path: '/tractors/:serialNumber/map',
      name: 'tractor-map',
      component: TractorMap
    }
  ]
})

export default router
