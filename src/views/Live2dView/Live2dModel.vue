<template>
  <!-- 动态大小的模型容器 -->
  <div class="model-container" ref="containerRef" :style="containerStyle">
    <!-- 拖动控制点 -->
    <div class="drag-handle" @mousedown="startDrag" @touchstart="startDrag">
      <div class="handle-icon">+</div>
    </div>
    
    <!-- canvas元素 -->
    <canvas id="canvas" class="live2d-canvas"></canvas>
  </div>
</template>

<script>
export default {
  name: 'Live2dModel',
  props: {
    canvasSize: {
      type: Object,
      required: true
    },
    position: {
      type: Object,
      required: true
    },
    speaking: {
      type: Boolean,
      default: false
    },
    audioUrl: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      // 拖动相关
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      
      // 语音相关
      isSpeaking: false,
      
      // 音频监听相关
      audioElements: [],
      currentAudioSourceId: null,
      processedAudioIds: new Set()
    }
  },
  
  computed: {
    containerStyle() {
      return {
        left: `${this.position.x}px`,
        top: `${this.position.y}px`,
        width: `${this.canvasSize.width}px`,
        height: `${this.canvasSize.height + 50}px` // 额外高度用于控制条
      }
    }
  },
  
  mounted() {
    // 添加窗口事件监听
    window.addEventListener('mousemove', this.handleDrag);
    window.addEventListener('mouseup', this.stopDrag);
    window.addEventListener('touchmove', this.handleDrag);
    window.addEventListener('touchend', this.stopDrag);
    
    // 监听全局音频播放事件
    window.addEventListener('ai-audio-play', this.handleGlobalAudioPlay);
    window.addEventListener('ai-audio-pause', this.handleGlobalAudioPause);
    window.addEventListener('ai-audio-ended', this.handleGlobalAudioEnd);
    
    // 为页面上已有的音频元素添加监听
    this.attachAudioListenersToExistingElements();
    
    // 监听DOM变化，为新增的音频元素添加监听
    this.setupMutationObserver();
    console.log('Live2dModel组件已挂载，开始监听音频事件');
  },
  
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('mousemove', this.handleDrag);
    window.removeEventListener('mouseup', this.stopDrag);
    window.removeEventListener('touchmove', this.handleDrag);
    window.removeEventListener('touchend', this.stopDrag);
    window.removeEventListener('ai-audio-play', this.handleGlobalAudioPlay);
    window.removeEventListener('ai-audio-pause', this.handleGlobalAudioPause);
    window.removeEventListener('ai-audio-ended', this.handleGlobalAudioEnd);
    
    this.detachAllAudioListeners();
    
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  
  watch: {
    speaking(newVal) {
      console.log('Live2dModel: speaking prop变化:', newVal);
      if (newVal !== this.isSpeaking) {
        this.isSpeaking = newVal;
        this.$emit('speaking-change', newVal);
      }
    },
    
    audioUrl(newUrl) {
      console.log('Live2dModel: audioUrl prop变化:', newUrl);
      if (newUrl && this.speaking) {
        this.$emit('play-audio', newUrl);
      }
    },
  },
  
  methods: {
    setupMutationObserver() {
      this.observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.nodeName.toLowerCase() === 'audio') {
                  this.attachAudioListeners(node);
                } else {
                  const audioElements = node.querySelectorAll('audio');
                  audioElements.forEach(audio => {
                    this.attachAudioListeners(audio);
                  });
                }
              }
            });
          }
        });
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },
    
    attachAudioListenersToExistingElements() {
      const audioElements = document.querySelectorAll('audio');
      console.log(`找到${audioElements.length}个已存在的音频元素`);
      audioElements.forEach(audio => {
        this.attachAudioListeners(audio);
      });
    },
    
    attachAudioListeners(audio) {
      if (this.audioElements.includes(audio)) return;
      
      audio.addEventListener('play', this.handleAudioPlay);
      audio.addEventListener('pause', this.handleAudioPause);
      audio.addEventListener('ended', this.handleAudioEnd);
      
      this.audioElements.push(audio);
    },
    
    detachAllAudioListeners() {
      this.audioElements.forEach(audio => {
        audio.removeEventListener('play', this.handleAudioPlay);
        audio.removeEventListener('pause', this.handleAudioPause);
        audio.removeEventListener('ended', this.handleAudioEnd);
      });
      this.audioElements = [];
    },
    
    handleGlobalAudioPlay(event) {
      console.log('收到全局音频播放事件', event.detail);
      const sourceId = event.detail.sourceElementId;
      
      if (this.processedAudioIds.has(sourceId)) {
        console.log(`已经处理过ID为${sourceId}的音频，忽略重复事件`);
        return;
      }
      
      this.processedAudioIds.add(sourceId);
      
      if (this.currentAudioSourceId === sourceId) {
        console.log('忽略来自相同音频源的播放事件');
        return;
      }
      
      this.currentAudioSourceId = sourceId;
      this.isSpeaking = true;
      this.$emit('speaking-change', true);
    },
    
    handleGlobalAudioPause(event) {
      console.log('收到全局音频暂停事件');
    },
    
    handleGlobalAudioEnd(event) {
      console.log('收到全局音频结束事件');
      
      if (this.currentAudioSourceId) {
        this.processedAudioIds.delete(this.currentAudioSourceId);
        this.currentAudioSourceId = null;
      }
      
      this.isSpeaking = false;
      this.$emit('speaking-change', false);
    },
    
    handleAudioPlay(event) {
      if (this.processedAudioIds.has(event.target.id)) {
        console.log('已通过全局事件处理过此音频，忽略直接事件');
        return;
      }
      
      const isAIAudio = !event.target.classList.contains('user-audio');
      
      if (isAIAudio) {
        if (!event.target.id) {
          event.target.id = 'audio-' + Date.now();
        }
        
        this.processedAudioIds.add(event.target.id);
        this.currentAudioSourceId = event.target.id;
        
        console.log('检测到AI音频播放');
        this.isSpeaking = true;
        this.$emit('speaking-change', true);
      }
    },
    
    handleAudioPause(event) {
      // 不直接停止说话，因为可能是临时暂停
    },
    
    handleAudioEnd(event) {
      const isAIAudio = !event.target.classList.contains('user-audio');
      if (isAIAudio) {
        console.log('AI音频播放结束');
        
        if (event.target.id) {
          this.processedAudioIds.delete(event.target.id);
        }
        
        if (this.processedAudioIds.size === 0) {
          this.isSpeaking = false;
          this.$emit('speaking-change', false);
        }
      }
    },
    
    startDrag(event) {
      this.isDragging = true;
      
      if (event.type.startsWith('mouse')) {
        this.dragOffset.x = event.clientX - this.position.x;
        this.dragOffset.y = event.clientY - this.position.y;
      } else {
        this.dragOffset.x = event.touches[0].clientX - this.position.x;
        this.dragOffset.y = event.touches[0].clientY - this.position.y;
      }
      
      event.preventDefault();
    },
    
    handleDrag(event) {
      if (!this.isDragging) return;
      
      let newX, newY;
      
      if (event.type.startsWith('mouse')) {
        newX = event.clientX - this.dragOffset.x;
        newY = event.clientY - this.dragOffset.y;
      } else {
        newX = event.touches[0].clientX - this.dragOffset.x;
        newY = event.touches[0].clientY - this.dragOffset.y;
      }
      
      this.$emit('position-change', { x: newX, y: newY });
    },
    
    stopDrag() {
      if (this.isDragging) {
        this.isDragging = false;
        this.$emit('drag-end');
      }
    }
  }
}
</script>

<style scoped>
.model-container {
  position: fixed;
  z-index: 1000;
  overflow: visible;
  transition: width 0.3s, height 0.3s;
  background-color: transparent;
  border: none;
}

.live2d-canvas {
  display: block;
  background-color: transparent !important;
  width: 100%;
  height: 100%;
  border: none;
}

/* 拖动控制点样式 */
.drag-handle {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(66, 185, 131, 0.8);
  cursor: move;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  touch-action: none;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.handle-icon {
  color: white;
  font-weight: bold;
  font-size: 16px;
}
</style>
