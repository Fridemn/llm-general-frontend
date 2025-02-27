<template>
  <div class="h-16 bg-white shadow-md flex items-center px-6">
    <div class="flex items-center space-x-4">
      <span class="text-gray-700">选择模型：</span>
      <select
        v-model="localModel"
        @change="$emit('model-change', localModel)"
        class="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option 
          v-for="model in models" 
          :key="model.id" 
          :value="model.id"
        >
          {{ model.name }}
        </option>
      </select>
    </div>

    <div class="ml-auto flex items-center space-x-4">
      <div class="text-sm text-gray-600">
        剩余配额：{{ quota }} 次
      </div>
      <button
        @click="handleBuyQuota"
        class="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        购买配额
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  selectedModel: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['model-change'])

const localModel = ref(props.selectedModel)
const quota = ref(100)

const models = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'claude', name: 'Claude' }
]

const handleBuyQuota = () => {
  // 处理购买配额逻辑
}
</script>
