<template>
  <div class="live2d-floating-container" :class="{ 'compact-mode': isCompactMode }" ref="containerRef" :style="containerStyle">
    <!-- 拖动区域 -->
    <div class="drag-handle" @mousedown="startDrag" @touchstart="startDrag">
      <div class="controls">
        <button class="control-btn" @click="toggleCompactMode">{{ isCompactMode ? '展开' : '收起' }}</button>
      </div>
    </div>
    
    <!-- 模型画布 -->
    <div class="live2d-container">
      <canvas id="canvas" title="使用鼠标滚轮可调整模型大小"></canvas>
    </div>
    
    <!-- 简化的控制界面 -->
    <div class="control-panel" v-if="!isCompactMode">
      <div class="control-section">
        <button class="primary-btn" @click="playRandomMotion">随机动作</button>
        <button class="primary-btn" @click="playRandomExpression">随机表情</button>
      </div>

      <div class="control-section">
        <label>数字人模型</label>
        <select v-model="selectedModel" class="select-input">
          <option v-for="model in modelList" :key="model" :value="model">{{ model }}</option>
        </select>
        <button class="primary-btn" @click="updateModel" :disabled="isProcessing">更新模型</button>
      </div>
    </div>
  </div>
  
  <!-- 加载和错误提示 -->
  <transition name="fade">
    <div v-if="loadingError" class="error-message">
      <h2>加载错误</h2>
      <p>{{ loadingError }}</p>
      <button class="primary-btn" @click="goHome">返回首页</button>
    </div>
  </transition>
  
  <transition name="fade">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>加载中，请稍候...</p>
    </div>
  </transition>
  
  <!-- 隐藏的音频元素，用于同步口型 -->
  <audio ref="audioPlayer" @play="onAudioPlay" @pause="onAudioPause" @ended="onAudioEnded" style="display:none"></audio>
</template>

<script>
export default {
  name: 'Live2dEdgeTTS',
  props: {
    // 是否正在说话
    speaking: {
      type: Boolean,
      default: false
    },
    // 当前播放的音频URL
    audioUrl: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 模型相关
      modelList: ['Hiyori', 'March 7th', 'MuraSame'], // 静态模型列表
      selectedModel: 'Hiyori',
      live2dModel: null,
      modelLoaded: false,
      
      // UI状态
      isProcessing: false,
      isLoading: true,
      loadingError: null,
      isCompactMode: false,
      
      // 控制选项
      eyesFollow: true,
      
      // 动作和表情列表
      motions: [],
      expressions: [],
      
      // 拖动相关
      isDragging: false,
      position: {
        x: 20,
        y: 20
      },
      dragOffset: {
        x: 0,
        y: 0
      },
      
      // 口型相关参数
      mouthOpenValue: 0,
      mouthUpdateInterval: null,
      audioContext: null,
      audioSource: null,
      audioAnalyser: null,
      frequencyData: null,
      isSpeaking: false,
      
      // 添加新属性用于口型同步
      mouthOpenParamName: null, // 找到的口型参数名
      usingBuiltInSpeech: false, // 是否使用模型内置的说话方法

      // 添加模型缩放相关变量
      modelScale: 1.2, // 默认缩放值，与setupModelPosition中一致
      minScale: 0.8,   // 最小缩放限制
      maxScale: 10,   // 最大缩放限制
      scaleStep: 0.1,  // 每次缩放步长
    }
  },
  
  computed: {
    // 根据拖动位置计算容器样式
    containerStyle() {
      return {
        left: `${this.position.x}px`,
        top: `${this.position.y}px`
      }
    }
  },
  
  // 生命周期钩子
  async mounted() {
    try {
      // 应用本地存储的位置
      this.loadPosition()
      
      // 初始化音频环境（保留但不使用）
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      
      await this.initializeApplication()

      // 加载保存的缩放值
      this.loadModelScale();
    } catch (error) {
      console.error('初始化失败:', error)
      this.loadingError = `初始化失败: ${error.message}`
      this.isLoading = false
    }
    
    // 添加窗口事件监听
    window.addEventListener('mousemove', this.handleDrag)
    window.addEventListener('mouseup', this.stopDrag)
    window.addEventListener('touchmove', this.handleDrag)
    window.addEventListener('touchend', this.stopDrag)
  },
  
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('mousemove', this.handleDrag)
    window.removeEventListener('mouseup', this.stopDrag)
    window.removeEventListener('touchmove', this.handleDrag)
    window.removeEventListener('touchend', this.stopDrag)

    // 移除滚轮事件监听
    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvas.removeEventListener('wheel', this.handleWheel);
    }
  },
  
  // 监听属性变化
  watch: {
    eyesFollow(newValue) {
      this.setCookie('eyes', newValue.toString(), 30)
    },
    position: {
      handler() {
        // 保存位置到本地存储
        this.savePosition()
      },
      deep: true
    },
    
    // 监听speaking属性变化
    speaking(newVal) {
      if (newVal) {
        this.startSpeaking()
      } else {
        this.stopSpeaking()
      }
    },
    
    // 监听audioUrl属性变化
    audioUrl(newUrl) {
      if (newUrl && this.speaking) {
        this.playAudio(newUrl)
      }
    }
  },
  
  methods: {
    // 应用初始化
    async initializeApplication() {
      // 从本地存储或cookie加载配置
      this.loadLocalConfig()
      this.loadSettingsFromCookies()
      this.setWhiteBackground()
      this.checkScriptsLoaded()
      
      // 扫描模型文件夹
      await this.scanModelFolders()
    },
    
    // 设置白色背景
    setWhiteBackground() {
      const canvas = document.getElementById("canvas");
      if (canvas) {
        canvas.style.backgroundColor = 'transparent';
        canvas.style.backgroundImage = 'none';
      }
    },
    
    // 检查脚本加载
    checkScriptsLoaded() {
      if (window.PIXI && window.PIXI.live2d) {
        console.log('脚本已加载，初始化Live2D模型');
        this.initLive2D();
      } else {
        console.error('未检测到必要的脚本');
        this.loadingError = '未能加载Live2D必要的库文件，请确保js文件夹中包含所有需要的脚本';
      }
      
      this.isLoading = false;
    },
    
    // 配置加载 - 改为从本地存储加载
    loadLocalConfig() {
      // 从本地存储加载配置
      try {
        console.log('从本地加载配置...');
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel) {
          this.selectedModel = savedModel;
          console.log('从本地存储加载到模型:', this.selectedModel);
        }
      } catch (error) {
        console.error('加载本地配置失败:', error);
        this.selectedModel = 'Hiyori';
        console.log('使用默认模型:', this.selectedModel);
      }
    },
    
    // 扫描模型文件夹 - 在浏览器环境下模拟
    async scanModelFolders() {
      console.log('模拟扫描模型文件夹...');
      
      const storedModelList = localStorage.getItem('modelList');
      if (storedModelList) {
        try {
          this.modelList = JSON.parse(storedModelList);
          console.log('从本地存储加载模型列表:', this.modelList);
        } catch (e) {
          console.error('解析存储的模型列表失败:', e);
        }
      }
    },
    
    // 初始化Live2D
    async initLive2D() {
      console.log('初始化Live2D...');
      if (!window.PIXI) {
        this.loadingError = 'PIXI未加载，请检查脚本';
        return;
      }
      
      const PIXI = window.PIXI;
      if (!PIXI.live2d) {
        this.loadingError = 'live2d插件未加载，请检查脚本';
        return;
      }
      
      try {
        // 创建PIXI应用
        const app = new PIXI.Application({
          view: document.getElementById("canvas"),
          autoStart: true,
          resizeTo: document.querySelector('.live2d-container'),
          transparent: true,
          backgroundAlpha: 0,
          antialias: true,
        });
        
        // 使用绝对路径来加载模型
        const modelPath = `/src/assets/models/${this.selectedModel}/${this.selectedModel}.model3.json`;
        console.log('加载模型路径:', modelPath);
        
        const model = await PIXI.live2d.Live2DModel.from(modelPath, { 
          autoInteract: this.eyesFollow 
        });
        
        // 调整模型尺寸和位置
        this.setupModelPosition(model);
        
        // 添加到舞台
        app.stage.addChild(model);
        
        // 设置交互
        this.setupModelInteractions(model);
        
        // 加载模型后获取可用的动作列表
        this.updateAvailableMotions(model);
        
        // 添加:获取可用的表情列表
        this.updateAvailableExpressions(model);
        
        // 初始化音频处理环境
        this.initAudioAnalyser()
        
        this.live2dModel = model;
        this.modelLoaded = true;
        console.log('Live2D初始化完成!');
        
        // 添加窗口大小变化监听，重新调整模型大小
        window.addEventListener('resize', () => {
          if (this.live2dModel && this.modelLoaded) {
            this.setupModelPosition(this.live2dModel);
          }
        });

        // 添加canvas元素的滚轮事件监听
        const canvas = document.getElementById("canvas");
        if (canvas) {
          canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        }
      } catch (error) {
        console.error('初始化Live2D失败:', error);
        this.loadingError = `Live2D模型加载失败: ${error.message}。请检查模型文件路径: /src/assets/models/${this.selectedModel}/${this.selectedModel}.model3.json`;
      }
    },
    
    // 设置模型位置和缩放 - 修改使用modelScale变量
    setupModelPosition(model) {
      const container = document.querySelector('.live2d-container');
      const scaleX = container.clientWidth / model.width;
      const scaleY = container.clientHeight / model.height;
      
      // 使用保存的缩放因子
      const baseScale = Math.min(scaleX, scaleY);
      const finalScale = baseScale * this.modelScale;
      model.scale.set(finalScale);
      
      // 保持水平居中
      model.x = container.clientWidth / 2;
      
      // 调整垂直位置，使面部在合适位置
      model.y = container.clientHeight * 0.4;
      
      console.log('模型缩放设置为:', this.modelScale, '当前缩放值:', model.scale.x);
    },
    
    // 设置模型交互
    setupModelInteractions(model) {
      // 使模型可拖动
      this.makeDraggable(model);
      
      // 添加点击交互
      model.on("hit", (hitAreas) => {
        if (hitAreas.includes("Body")) {
          model.motion("Tap");
        }
        if (hitAreas.includes("Head")) {
          model.expression();
        }
      });
    },
    
    // 使模型可拖动
    makeDraggable(model) {
      model.buttonMode = true;
      
      model.on("pointerdown", (e) => {
        model.dragging = true;
        model._pointerX = e.data.global.x - model.x;
        model._pointerY = e.data.global.y - model.y;
      });
      
      model.on("pointermove", (e) => {
        if (model.dragging) {
          model.position.x = e.data.global.x - model._pointerX;
          model.position.y = e.data.global.y - model._pointerY;
        }
      });
      
      model.on("pointerupoutside", () => (model.dragging = false));
      model.on("pointerup", () => (model.dragging = false));
    },
    
    // 更新模型 - 改为本地存储和重载
    updateModel() {
      if (this.isProcessing) return;
      this.isProcessing = true;
      
      try {
        // 绝对路径测试
        const modelPath = `/src/assets/models/${this.selectedModel}/`;
        console.log('检查模型目录:', modelPath);
        
        // 保存选择到本地存储
        localStorage.setItem('selectedModel', this.selectedModel);
        console.log('模型选择已保存到本地存储');
        
        // 重新加载页面以应用新模型
        location.reload();
      } catch (error) {
        console.error('更新模型失败:', error);
        alert('更新模型失败: ' + error.message);
      } finally {
        this.isProcessing = false;
      }
    },
    
    // 播放随机动作
    playRandomMotion() {
      if (!this.live2dModel || !this.modelLoaded) {
        console.log('模型尚未加载，无法执行动作');
        return;
      }

      if (this.motions.length === 0) {
        console.log('模型没有可用的动作');
        return;
      }
      
      // 从动作列表中随机选择一个
      const randomIndex = Math.floor(Math.random() * this.motions.length);
      const randomMotion = this.motions[randomIndex];
      
      console.log(`播放动作: ${randomMotion}`);
      this.live2dModel.motion(randomMotion);
    },
    
    // 播放随机表情
    playRandomExpression() {
      if (!this.live2dModel || !this.modelLoaded) {
        console.log('模型尚未加载，无法执行表情');
        return;
      }
      
      if (this.expressions.length === 0) {
        console.log('模型没有可用的表情');
        return;
      }
      
      // 从表情列表中随机选择一个
      const randomIndex = Math.floor(Math.random() * this.expressions.length);
      
      console.log(`播放表情索引: ${randomIndex}`);
      
      // 直接使用索引值，而不是表情名称
      this.live2dModel.expression(randomIndex);
    },
    
    // 更新可用动作列表
    updateAvailableMotions(model) {
      try {
        // 尝试获取当前模型的动作组列表
        if (model.internalModel && model.internalModel.motionManager) {
          const motionGroups = Object.keys(model.internalModel.motionManager.definitions);
          if (motionGroups.length > 0) {
            this.motions = motionGroups;
            console.log('可用动作组:', this.motions);
          }
        }
      } catch (error) {
        console.warn('获取动作列表失败，使用默认动作:', error);
      }
    },
    
    // 更新可用表情列表
    updateAvailableExpressions(model) {
      try {
        // 获取当前模型的表情列表
        if (model.internalModel && model.internalModel.settings && 
            model.internalModel.settings.expressions) {
          // 存储表情名称用于显示
          const availableExpressions = model.internalModel.settings.expressions.map(exp => exp.Name);
          
          if (availableExpressions.length > 0) {
            this.expressions = availableExpressions;
            console.log('可用表情:', this.expressions);
          }
        }
      } catch (error) {
        console.warn('获取表情列表失败:', error);
      }
    },

    // 初始化音频分析器 - 修复音频上下文创建和连接问题
    initAudioAnalyser() {
      try {
        console.log('初始化音频分析器...');
        // 由于音频上下文需要用户交互才能创建，这里先不创建
        // 将在播放音频时按需创建
        this.frequencyData = new Uint8Array(16); // 预先创建频率数据数组
        console.log('音频分析器预备完成');
      } catch (error) {
        console.error('初始化音频分析器预备失败:', error);
      }
    },
    
    // 播放音频并同步口型 - 使用模型自带的speak功能
    playAudio(url) {
      console.log('开始播放音频并同步口型:', url);
      
      if (this.live2dModel && this.modelLoaded) {
        // 使用模型自带的speak功能播放音频
        this.talk(this.live2dModel, url);
        console.log('使用模型自带speak功能播放音频');
      } else {
        // 如果模型未加载，则使用标准音频元素播放
        const audioPlayer = this.$refs.audioPlayer;
        if (!audioPlayer) {
          console.error('找不到音频播放器元素');
          return;
        }
        
        // 设置新的音频源
        audioPlayer.src = url;
        audioPlayer.load();
        
        // 尝试播放
        audioPlayer.play().catch(error => {
          console.error('播放音频失败:', error);
          if (error.name !== 'NotAllowedError') {
            this.stopSpeaking();
          } else {
            console.log('需要用户交互才能播放音频');
            // 使用模拟口型
            this.startSimulatedMouthTracking();
          }
        });
      }
    },
    
    // 控制模型说话 - 添加该方法用于直接使用模型speak功能
    talk(model, audio) {
      try {
        // 使用模型自带的speak功能，配置最佳的口型同步参数
        model.speak(audio, {
          volume: 1,
          expression: this.expressions.length > 8 ? 8 : 0, // 如果有足够的表情，使用第8个，否则用默认表情
          resetExpression: true,    // 说话完成后重置表情
          autoPlay: true,           // 自动播放音频
          crossOrigin: "anonymous", // 允许跨域音频
          onFinish: () => {         // 播放完成后的回调
            console.log('模型speak播放完成');
            this.stopSpeaking();
          },
          onError: (e) => {         // 出错处理
            console.error('模型speak出错:', e);
            // 回退到标准播放方法
            this.fallbackToStandardPlayback(audio);
          }
        });
        
        // 设置说话状态
        this.isSpeaking = true;
      } catch (error) {
        console.error('使用模型speak功能失败:', error);
        // 回退到标准播放方法
        this.fallbackToStandardPlayback(audio);
      }
    },
    
    // 回退到标准音频播放方法
    fallbackToStandardPlayback(url) {
      console.log('回退到标准音频播放方法');
      
      try {
        // 初始化音频上下文
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.audioAnalyser = this.audioContext.createAnalyser();
          this.audioAnalyser.fftSize = 32;
          this.frequencyData = new Uint8Array(this.audioAnalyser.frequencyBinCount);
        }
        
        const audioPlayer = this.$refs.audioPlayer;
        audioPlayer.src = url;
        audioPlayer.load();
        
        // 连接音频分析器
        if (this.audioContext && this.audioAnalyser) {
          if (this.audioSource) {
            try { this.audioSource.disconnect(); } catch (e) { /* 忽略错误 */ }
          }
          
          this.audioSource = this.audioContext.createMediaElementSource(audioPlayer);
          this.audioSource.connect(this.audioAnalyser);
          this.audioAnalyser.connect(this.audioContext.destination);
          
          // 开始口型跟踪
          this.startMouthTracking();
        }
        
        // 播放音频
        audioPlayer.play().catch(e => {
          console.error('回退播放也失败:', e);
          // 使用模拟口型
          this.startSimulatedMouthTracking();
        });
      } catch (error) {
        console.error('回退播放方法出错:', error);
        // 最后的尝试：使用模拟口型
        this.startSimulatedMouthTracking();
      }
    },
    
    // 开始跟踪口型 - 更新口型跟踪逻辑
    startMouthTracking() {
      console.log('开始跟踪口型');
      
      // 清除之前的定时器
      if (this.mouthUpdateInterval) {
        clearInterval(this.mouthUpdateInterval);
      }
      
      this.mouthUpdateInterval = setInterval(() => {
        // 分析音频数据，更新口型
        if (this.audioAnalyser && this.frequencyData) {
          try {
            this.audioAnalyser.getByteFrequencyData(this.frequencyData);
            
            // 计算音量，关注低频和中频段
            let sum = 0;
            // 只使用前半部分频率数据，这通常对应人声频率
            const relevantDataLength = Math.min(8, this.frequencyData.length);
            for (let i = 0; i < relevantDataLength; i++) {
              sum += this.frequencyData[i];
            }
            
            const average = sum / relevantDataLength;
            
            // 映射到口型开合值 (0-1 范围)，增加灵敏度
            this.mouthOpenValue = Math.min(average / 64, 1) * 0.8;
            
            // 添加随机变化使口型更自然
            const randomVariation = (Math.random() * 0.1) - 0.05; // -0.05到0.05的随机值
            this.mouthOpenValue = Math.max(0, Math.min(1, this.mouthOpenValue + randomVariation));
            
            // 更新模型口型
            this.updateMouthForm();
            
            // 输出调试信息，每秒一次
            if (Date.now() % 1000 < 50) {
              console.log('当前口型值:', this.mouthOpenValue, '平均音量:', average);
            }
          } catch (e) {
            console.warn('获取频率数据失败:', e);
          }
        } else {
          console.warn('音频分析器或频率数据未初始化');
        }
      }, 50); // 20fps更新率
    },
    
    // 使用模拟方式跟踪口型（当无法访问音频数据时使用）
    startSimulatedMouthTracking() {
      console.log('开始使用模拟口型');
      
      if (this.mouthUpdateInterval) {
        clearInterval(this.mouthUpdateInterval);
      }
      
      let phase = 0;
      const cycleLength = 20; // 完整周期的帧数
      
      this.mouthUpdateInterval = setInterval(() => {
        // 使用正弦波模拟说话口型
        phase = (phase + 1) % cycleLength;
        const normalizedPhase = phase / cycleLength;
        
        // 使用正弦波生成更自然的口型变化 (0-0.8范围)
        this.mouthOpenValue = 0.4 * (Math.sin(normalizedPhase * Math.PI * 2) + 1) * 0.8;
        
        // 添加随机变化
        const randomVariation = (Math.random() * 0.1) - 0.05;
        this.mouthOpenValue = Math.max(0, Math.min(0.8, this.mouthOpenValue + randomVariation));
        
        // 更新口型
        this.updateMouthForm();
      }, 50);
    },
    
    // 更新模型口型参数 - 增强口型参数检测和设置
    updateMouthForm() {
      if (!this.live2dModel || !this.modelLoaded) return;
      
      try {
        // 列出可能的口型参数名，按常见程度排序
        const possibleParams = [
          'ParamMouthOpenY',
          'PARAM_MOUTH_OPEN_Y', 
          'Param_Mouth_Open',
          'ParamMouthOpen',
          'ParamMouthOpenB', // 有些模型使用B变体
          'PARAM_MOUTH_FORM', // 口型形状参数
          'Mouth' // 简化名称
        ];
        
        // 使用一个附加参数来控制口型形状
        const formParams = [
          'ParamMouthForm',
          'PARAM_MOUTH_FORM'
        ];
        
        let paramFound = false;
        
        // 检测模型中的参数
        if (!this.mouthOpenParamName && this.live2dModel.internalModel) {
          // 尝试直接获取模型参数ID列表
          try {
            const model = this.live2dModel.internalModel.coreModel;
            const paramCount = model.getParameterCount ? model.getParameterCount() : 0;
            console.log('模型参数总数:', paramCount);
            
            // 输出所有参数名称用于调试
            if (model.getParameterId) {
              console.log('模型可用参数:');
              for (let i = 0; i < Math.min(paramCount, 30); i++) {
                console.log(`- ${model.getParameterId(i)}`);
              }
            }
          } catch (e) {
            console.warn('无法枚举模型参数:', e);
          }
        }
        
        // 尝试找到并设置口型参数
        for (const param of possibleParams) {
          if (this.live2dModel.internalModel && 
              this.live2dModel.internalModel.coreModel) {
            
            // 使用获取参数索引的方法
            try {
              const index = this.live2dModel.internalModel.coreModel.getParameterIndex(param);
              if (index !== -1) {
                // 找到可用参数，保存它
                this.mouthOpenParamName = param;
                
                // 设置值
                this.live2dModel.internalModel.coreModel.setParameterValueById(param, this.mouthOpenValue);
                paramFound = true;
                break;
              }
            } catch (e) {
              // 这个方法不可用，尝试下一个
              console.warn(`使用getParameterIndex('${param}')失败:`, e);
            }
            
            // 尝试使用通用参数设置
            try {
              this.live2dModel.internalModel.coreModel.setParameterValueById(param, this.mouthOpenValue);
              this.mouthOpenParamName = param;
              paramFound = true;
              break;
            } catch (e) {
              // 这个方法或参数不可用，继续尝试
              continue;
            }
          }
        }
        
        // 设置口型形状参数(如果找到合适的)
        if (paramFound && this.mouthOpenValue > 0.2) {
          // 当嘴巴张开时，尝试设置口型形状
          for (const formParam of formParams) {
            try {
              const formValue = 0.5; // 中性口型形状
              this.live2dModel.internalModel.coreModel.setParameterValueById(formParam, formValue);
            } catch (e) {
              // 参数不可用，继续尝试
              continue;
            }
          }
        }
        
        // 如果没找到合适的参数，尝试使用模型的现有方法
        if (!paramFound) {
          try {
            // 检查模型是否有直接的说话方法
            if (typeof this.live2dModel.speak === 'function') {
              // 标记为使用内置方法
              this.usingBuiltInSpeech = true;
            } else {
              console.warn('未找到合适的口型参数，口型同步可能无法正常工作');
            }
          } catch (e) {
            console.warn('检查内置说话方法失败:', e);
          }
        }
      } catch (error) {
        console.warn('更新口型参数失败:', error);
      }
    },
    
    // 停止说话动画 - 增强停止逻辑
    stopSpeaking() {
      console.log('停止说话动画');
      this.isSpeaking = false;
      
      // 优先使用模型自带的停止说话方法
      if (this.live2dModel) {
        if (typeof this.live2dModel.stopSpeaking === 'function') {
          try {
            this.live2dModel.stopSpeaking();
          } catch (e) {
            console.warn('模型stopSpeaking方法出错:', e);
          }
        }
      }
      
      // 停止音频播放
      const audioPlayer = this.$refs.audioPlayer;
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      }
      
      // 停止口型更新
      if (this.mouthUpdateInterval) {
        clearInterval(this.mouthUpdateInterval);
        this.mouthUpdateInterval = null;
      }
      
      // 重置口型
      this.mouthOpenValue = 0;
      this.updateMouthForm();
    },
    
    // 音频事件处理
    onAudioPlay() {
      console.log('音频开始播放');
      this.isSpeaking = true;
    },
    
    onAudioPause() {
      console.log('音频暂停');
      // 不停止口型，因为可能是临时暂停
    },
    
    onAudioEnded() {
      console.log('音频播放结束');
      this.stopSpeaking();
    },

    // Cookie 操作
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    },
    
    setCookie(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value}; ${expires}; path=/`;
    },
    
    // 从 Cookie 加载设置
    loadSettingsFromCookies() {
      // 眼睛跟随设置
      const eyesValue = this.getCookie("eyes");
      if (eyesValue === "false") this.eyesFollow = false;
      
      // 加载紧凑模式设置
      const compactMode = localStorage.getItem("live2d_compact_mode");
      if (compactMode === "true") this.isCompactMode = true;
    },
    
    // 返回首页
    goHome() {
      this.$router.push('/');
    },
    
    // 切换紧凑模式
    toggleCompactMode() {
      this.isCompactMode = !this.isCompactMode;
      localStorage.setItem("live2d_compact_mode", this.isCompactMode.toString());
    },
    
    // 拖动控制
    startDrag(event) {
      this.isDragging = true;
      
      // 处理鼠标事件或触摸事件
      if (event.type.startsWith('mouse')) {
        this.dragOffset.x = event.clientX - this.position.x;
        this.dragOffset.y = event.clientY - this.position.y;
      } else {
        // 触摸事件
        this.dragOffset.x = event.touches[0].clientX - this.position.x;
        this.dragOffset.y = event.touches[0].clientY - this.position.y;
      }
      
      // 防止事件冒泡和默认行为
      event.preventDefault();
    },
    
    handleDrag(event) {
      if (!this.isDragging) return;
      
      // 处理鼠标事件或触摸事件
      if (event.type.startsWith('mouse')) {
        this.position.x = event.clientX - this.dragOffset.x;
        this.position.y = event.clientY - this.dragOffset.y;
      } else {
        // 触摸事件
        this.position.x = event.touches[0].clientX - this.dragOffset.x;
        this.position.y = event.touches[0].clientY - this.dragOffset.y;
      }
    },
    
    stopDrag() {
      this.isDragging = false;
      this.savePosition();
    },
    
    // 保存位置到本地存储
    savePosition() {
      try {
        localStorage.setItem('live2d_position', JSON.stringify(this.position));
      } catch (error) {
        console.error('保存位置失败:', error);
      }
    },
    
    // 从本地存储加载位置
    loadPosition() {
      try {
        const savedPosition = localStorage.getItem('live2d_position');
        if (savedPosition) {
          this.position = JSON.parse(savedPosition);
        }
      } catch (error) {
        console.error('加载位置失败:', error);
      }
    },

    // 处理鼠标滚轮事件
    handleWheel(event) {
      event.preventDefault(); // 防止页面滚动
      
      // 确定缩放方向 (deltaY 小于0表示向上滚动，放大模型)
      const scaleDelta = event.deltaY < 0 ? this.scaleStep : -this.scaleStep;
      
      // 计算新的缩放值，限制在允许范围内
      const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.modelScale + scaleDelta));
      
      // 如果缩放值有变化
      if (newScale !== this.modelScale) {
        this.modelScale = newScale;
        
        // 应用新的缩放值到模型
        this.updateModelScale();
        
        // 保存缩放值到本地存储
        this.saveModelScale();
        
        console.log(`模型缩放值更新为: ${this.modelScale.toFixed(2)}`);
      }
    },
    
    // 更新模型缩放
    updateModelScale() {
      if (!this.live2dModel || !this.modelLoaded) return;
      
      const container = document.querySelector('.live2d-container');
      const scaleX = container.clientWidth / this.live2dModel.width;
      const scaleY = container.clientHeight / this.live2dModel.height;
      
      // 使用当前缩放因子和容器尺寸计算最终缩放值
      const baseScale = Math.min(scaleX, scaleY);
      const finalScale = baseScale * this.modelScale;
      
      // 应用缩放
      this.live2dModel.scale.set(finalScale);
      
      // 保持居中
      this.live2dModel.x = container.clientWidth / 2;
      this.live2dModel.y = container.clientHeight * 0.4;
    },
    
    // 保存模型缩放值到本地存储
    saveModelScale() {
      try {
        localStorage.setItem('live2d_model_scale', this.modelScale.toString());
      } catch (error) {
        console.error('保存模型缩放值失败:', error);
      }
    },
    
    // 从本地存储加载模型缩放值
    loadModelScale() {
      try {
        const savedScale = localStorage.getItem('live2d_model_scale');
        if (savedScale) {
          const parsedScale = parseFloat(savedScale);
          if (!isNaN(parsedScale) && parsedScale >= this.minScale && parsedScale <= this.maxScale) {
            this.modelScale = parsedScale;
            console.log('从本地存储加载模型缩放值:', this.modelScale);
          }
        }
      } catch (error) {
        console.error('加载模型缩放值失败:', error);
      }
    },
  }
}
</script>

<style scoped>
.live2d-floating-container {
  position: fixed;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 360px;
  max-width: 90vw;
  overflow: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  right: 20px;
  top: 20px;
}

.live2d-floating-container.compact-mode {
  width: 260px;
  height: 300px;
}

.drag-handle {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  cursor: move;
  display: flex;
  justify-content: flex-end;
  user-select: none;
  touch-action: none;
}

.controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  background-color: rgba(66, 185, 131, 0.8);
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.live2d-container {
  width: 100%;
  height: 300px;
  overflow: hidden;
  background-color: transparent;
  position: relative; /* 确保相对定位，使模型可以溢出而不影响布局 */
}

/* 确保模型可以正确地溢出容器边界 */
#canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.control-panel {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  max-height: 300px;
  overflow-y: auto;
}

.control-section {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-section:last-child {
  margin-bottom: 0;
}

.primary-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.primary-btn:disabled {
  background-color: #a8d5c2;
  cursor: not-allowed;
}

.select-input {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
  margin-bottom: 8px;
}

.radio-group {
  display: flex;
  gap: 10px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #42b983;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  z-index: 1100;
  max-width: 80%;
  text-align: center;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 添加提示器样式 */
.scale-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.scale-indicator.visible {
  opacity: 1;
}

/* 添加hover时的提示 */
.live2d-container:hover::after {
  content: "滚轮调整大小";
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  animation: fadeOut 3s forwards;
}

@keyframes fadeOut {
  0% { opacity: 0.8; }
  70% { opacity: 0.8; }
  100% { opacity: 0; }
}
</style>
