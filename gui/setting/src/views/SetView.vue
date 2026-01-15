<script setup>
import iconCancel from "@/components/icons/cancel.vue";
const message = useMessage();
const settings = ref({})

const isShow = ref(false);
const btnLoading = ref(false);
const btnText = ref("清除缓存");
const isEdgeAdsorption = ref(false)
const isMemoryOptimizationEnabled = ref(false)
const isOpenDevTools = ref(false)
const isOpenZoom = ref(false)
const isAutoLaunch = ref(false)
const isMenuVisible = ref(true)
const isOpenContextMenu = ref(true)
const systemTheme = ref("system")
const leftMenuPosition = ref('left')
const howLinkOpenMethod = ref('tuboshu')
const defaultWindowSize = ref({width: 1024, height: 800})

// 1Password 扩展配置
const is1PasswordEnabled = ref(false)
const onePasswordExtensionPath = ref('')
const pathValidationStatus = ref('none') // 'none' | 'validating' | 'valid' | 'invalid'
const pathValidationMessage = ref('')

const version = ref({
  version: '加载中...',
  electron: '--',
  chrome: '--'
})

const themes = [
  {label: '跟随系统', value: 'system'},
  {label: '普通模式', value: 'light'},
  {label: '深度模式', value: 'dark'}
]
const leftMenu = [
    {label: '左侧', value: 'left'},
    {label: '右侧', value: 'right'}
]
const linkOpenMethod = [
  {label: 'Tuboshu弹窗', value: 'tuboshu'},
  {label: '默认浏览器', value: 'browser'}
]


const getValue= (name, obj) => {
  let item = obj.value.find((item) => item.name === name);
  if(typeof item.value === 'number') return item.value !== 0;
  if(typeof item.value === 'string' && item.value === "0") return false;
  return item.value;
}

onMounted(async () => {
  version.value = await window.myApi.getVersion();
  settings.value = await window.myApi.getSettings();

  isEdgeAdsorption.value = getValue('isWindowEdgeAdsorption', settings);
  isMemoryOptimizationEnabled.value = getValue('isMemoryOptimizationEnabled', settings);
  leftMenuPosition.value = getValue('leftMenuPosition', settings);
  systemTheme.value = getValue('systemTheme', settings);
  isMenuVisible.value = getValue('isMenuVisible', settings);
  isOpenDevTools.value = getValue('isOpenDevTools', settings);
  isOpenZoom.value = getValue('isOpenZoom', settings);
  isOpenContextMenu.value = getValue('isOpenContextMenu', settings);
  isAutoLaunch.value = getValue('isAutoLaunch', settings);
  defaultWindowSize.value = getValue('defaultWindowSize', settings);
  howLinkOpenMethod.value = getValue('howLinkOpenMethod', settings);

  // 加载 1Password 扩展配置
  await load1PasswordConfig();
})



const changeSwitch = async (val) => {
  const setting = { name : 'isWindowEdgeAdsorption', value: val ? 1 : 0}
  window.myApi.updateSetting(setting);
  message.success(`设置已更新,请重新启动`)
}

const changeOptimize = async (val) => {
  const setting = { name : 'isMemoryOptimizationEnabled', value: val ? 1 : 0}
  window.myApi.updateSetting(setting);
  message.success(`设置已更新,请重新启动`)
}

const changeMenuVisible = (val) => {
  window.myApi.updateSetting({ name : 'isMenuVisible', value: val ? 1 : 0});
  message.success(`设置已更新,请重新启动`)
}

const changeDevTools = (val) => {
  window.myApi.updateSetting({ name : 'isOpenDevTools', value: val ? 1 : 0});
  message.success(`设置已更新,请重新启动`)
}

const changeZoom= (val) => {
  window.myApi.updateSetting({ name : 'isOpenZoom', value: val ? 1 : 0});
  message.success(`设置已更新,请重新启动`)
}

const changeContextMenu= (val) => {
  window.myApi.updateSetting({ name : 'isOpenContextMenu', value: val ? 1 : 0});
  message.success(`设置已更新,请重新启动`)
}

const changeAutoLaunch= (val) => {
  window.myApi.updateSetting({ name : 'isAutoLaunch', value: val ? 1 : 0});
  message.success(`设置已更新,请重新启动`)
}


const changeTheme = (e) => {
  window.myApi.updateSetting({ name : 'systemTheme', value: e.target.value});
  message.success(`设置已更新,请重新启动`)
}

const changeMenuPos = (e) => {
  window.myApi.updateSetting({ name : 'leftMenuPosition', value:e.target.value});
  message.success(`设置已更新,请重新启动`)
}

const changeLinkOpenMethod = (e) => {
  window.myApi.updateSetting({ name : 'howLinkOpenMethod', value:e.target.value});
  message.success(`设置已更新,请重新启动`)
}

const handleWinChange = (e) => {
  const { value, placeholder } = e.target;
  const key = placeholder === 'width' ? 'width' : 'height';
  const numValue = Number(value);
  let setting = {};

  if (isNaN(numValue) || numValue <= 0) {
    message.error('请输入有效的正数');
    return;
  }

  if(key === 'width'){
    if(numValue > 3000){
      message.error('宽度不能超过3000px');
      return;
    }
    if(numValue < 300){
      message.error('宽度不能小于300px');
      return;
    }
    setting = {width: numValue, height: Number(defaultWindowSize.value.height)}
  }

  if(key === 'height'){
    if(numValue > 2000){
      message.error('高度不能超过2000px');
      return;
    }
    if (numValue < 300){
      message.error('高度不能小于300px');
      return;
    }
    setting = {width: Number(defaultWindowSize.value.width), height: numValue};
  }
  window.myApi.updateSetting({ name : 'defaultWindowSize', value: setting});
  message.success(`设置已更新,请重新启动`)
}

// 1Password 扩展配置相关函数
const load1PasswordConfig = async () => {
  try {
    const config = await window.myApi.get1PasswordConfig();
    is1PasswordEnabled.value = config.enabled;
    onePasswordExtensionPath.value = config.path || '';
    
    // 如果有路径，验证它
    if (onePasswordExtensionPath.value) {
      await validatePath(onePasswordExtensionPath.value);
    }
  } catch (error) {
    console.error('Failed to load 1Password config:', error);
  }
}

const change1PasswordEnabled = async (val) => {
  try {
    const result = await window.myApi.set1PasswordConfig({ enabled: val });
    if (result.success) {
      message.success('设置已更新，请重新启动');
    } else {
      message.error(result.error || '保存失败');
      // 恢复原值
      is1PasswordEnabled.value = !val;
    }
  } catch (error) {
    message.error('保存失败: ' + error.message);
    is1PasswordEnabled.value = !val;
  }
}

const validatePath = async (path) => {
  if (!path) {
    pathValidationStatus.value = 'none';
    pathValidationMessage.value = '';
    return;
  }
  
  pathValidationStatus.value = 'validating';
  pathValidationMessage.value = '验证中...';
  
  try {
    const result = await window.myApi.validate1PasswordPath(path);
    if (result.valid) {
      pathValidationStatus.value = 'valid';
      pathValidationMessage.value = result.extensionName 
        ? `有效: ${result.extensionName}` 
        : '路径有效';
    } else {
      pathValidationStatus.value = 'invalid';
      pathValidationMessage.value = result.error || '路径无效';
    }
  } catch (error) {
    pathValidationStatus.value = 'invalid';
    pathValidationMessage.value = '验证失败: ' + error.message;
  }
}

const handlePathChange = async () => {
  await validatePath(onePasswordExtensionPath.value);
  
  // 只有路径有效时才保存
  if (pathValidationStatus.value === 'valid') {
    try {
      const result = await window.myApi.set1PasswordConfig({ 
        path: onePasswordExtensionPath.value 
      });
      if (result.success) {
        message.success('路径已保存，请重新启动');
      } else {
        message.error(result.error || '保存失败');
      }
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  }
}

const handleSelectFolder = async () => {
  try {
    const result = await window.myApi.select1PasswordFolder();
    if (!result.canceled && result.path) {
      onePasswordExtensionPath.value = result.path;
      await handlePathChange();
    }
  } catch (error) {
    message.error('选择文件夹失败: ' + error.message);
  }
}

const handleBtnClick = async ()=> {
  btnLoading.value = true;
  btnText.value = '正在清除缓存';
  await window.myApi.clearCache()
  setTimeout(() => {
    btnLoading.value = false;
    btnText.value = '清除缓存';
    message.success(`Tuboshu缓存已清除`)
    }, 2e3);
}
const  handleSponsorClick = () =>{
  isShow.value = true;
}
const handleClose = () =>{
  isShow.value = false;
}

</script>

<template>
  <div id="content-main">
    <n-alert :show-icon="false" type="info" style="margin-bottom: 1rem;">
      <n-h3 style="margin-bottom: 0;">通用设置</n-h3>
    </n-alert>

    <n-card embedded :bordered="true" style="margin-top:1rem;">
      <div class="wrap">

        <div class="card">
          <div class="vleft">启动窗口：</div>
          <div class="vright">
            <n-input-group @change="handleWinChange">
              <n-input size="small"
                       v-model:value="defaultWindowSize.width"
                       :style="{ width: '20%' }"
                       placeholder="width"  /> x
              <n-input size="small"
                       v-model:value="defaultWindowSize.height"
                       :style="{ width: '20%' }"
                       placeholder="height" />
            </n-input-group>
          </div>
        </div>

        <div class="card">
          <div class="vleft">开机启动：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="isAutoLaunch"
                      @update:value="changeAutoLaunch" style="font-size:12px;" >
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>
        <div class="card">
          <div class="vleft">调试模式：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="isOpenDevTools"
                      @update:value="changeDevTools" style="font-size:12px;" >
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">边缘吸附：</div>
          <div class="vright">
            <n-switch size="medium"
              v-model:value="isEdgeAdsorption"
              @update:value="changeSwitch"
              style="font-size:12px;" >
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">页面缩放：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="isOpenZoom"
                      @update:value="changeZoom" style="font-size:12px;" >
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">内存优化：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="isMemoryOptimizationEnabled"
                      @update:value="changeOptimize" style="font-size:12px;" >
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">右键菜单：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="isOpenContextMenu"
                      @update:value="changeContextMenu" style="font-size:12px;" >
              <template #checked>显示</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">显示边栏：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="isMenuVisible"
                      @update:value="changeMenuVisible" style="font-size:12px;" >
              <template #checked>显示</template>
              <template #unchecked>隐藏</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">边栏位置：</div>
          <div class="vright">
            <n-radio-group size="small"
                 @change="changeMenuPos"
                 v-model:value="leftMenuPosition" name="menuPoss" style="font-size: 12px;">
              <n-radio-button
                  v-for="item in leftMenu"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
              />
            </n-radio-group>
          </div>
        </div>

        <div class="card">
          <div class="vleft">外部链接：</div>
          <div class="vright">
            <n-radio-group size="small"
                 @change="changeLinkOpenMethod"
                 v-model:value="howLinkOpenMethod" name="openLink" style="font-size: 12px;">
              <n-radio-button
                  v-for="item in linkOpenMethod"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
              />
            </n-radio-group>
          </div>
        </div>

        <div class="card">
          <div class="vleft">系统主题：</div>
          <div class="vright">
            <n-radio-group size="small"
             @change="changeTheme"
             v-model:value="systemTheme" name="themegroup1" style="font-size: 12px;">
              <n-radio-button
                  v-for="item in themes"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
              />
            </n-radio-group>
          </div>
        </div>

      </div>
    </n-card>

    <!-- 1Password 扩展配置 -->
    <n-alert :show-icon="false" type="info" style="margin-top: 1.5rem; margin-bottom: 1rem;">
      <n-h3 style="margin-bottom: 0;">1Password 扩展</n-h3>
    </n-alert>

    <n-card embedded :bordered="true">
      <div class="wrap">
        <div class="card">
          <div class="vleft">启用扩展：</div>
          <div class="vright">
            <n-switch size="medium"
                      v-model:value="is1PasswordEnabled"
                      @update:value="change1PasswordEnabled" style="font-size:12px;" >
              <template #checked>开启</template>
              <template #unchecked>关闭</template>
            </n-switch>
          </div>
        </div>

        <div class="card">
          <div class="vleft">扩展路径：</div>
          <div class="vright path-input-group">
            <n-input-group>
              <n-input 
                v-model:value="onePasswordExtensionPath"
                placeholder="选择 1Password 扩展目录"
                :status="pathValidationStatus === 'invalid' ? 'error' : pathValidationStatus === 'valid' ? 'success' : undefined"
                @blur="handlePathChange"
                style="flex: 1;"
              />
              <n-button @click="handleSelectFolder" type="primary">
                浏览
              </n-button>
            </n-input-group>
          </div>
        </div>

        <div class="card" v-if="pathValidationStatus !== 'none'">
          <div class="vleft">验证状态：</div>
          <div class="vright">
            <n-tag 
              :type="pathValidationStatus === 'valid' ? 'success' : pathValidationStatus === 'invalid' ? 'error' : 'info'"
              :bordered="false"
              size="small"
            >
              {{ pathValidationMessage }}
            </n-tag>
          </div>
        </div>

        <div class="card">
          <div class="vleft"></div>
          <div class="vright">
            <n-text depth="3" style="font-size: 12px;">
              提示：请选择已解压的 1Password Chrome 扩展目录（包含 manifest.json 文件）
            </n-text>
          </div>
        </div>
      </div>
    </n-card>

    <n-card embedded :bordered="true" style="margin-top: 20px;">
      <n-button :loading="btnLoading" @click="handleBtnClick">{{btnText}}</n-button>
    </n-card>

    <n-card embedded :bordered="true" style="margin-top: 20px;">
      <span style="padding-right: 20px;">
        当前版本: <n-tag :bordered="false" type="info" size="medium">{{version.version}}</n-tag>
      </span>
      <span style="padding-right: 20px;">
          最新版本: <n-tag :bordered="false" type="info" size="medium">{{version.newVersion}}</n-tag>
      </span>
      <span>
          获取新版：
        <n-tag :bordered="false" type="info" size="medium" style="margin-right: 20px;">
          <a target="_blank" :href="version.github">GitHub下载</a>
        </n-tag>
        <n-tag :bordered="false" type="error" size="medium">
          <a target="_blank" :href="version.download">国内下载</a>
        </n-tag>
      </span>
      <span style="padding-left: 20px;">
          <n-tag :bordered="false" @click="handleSponsorClick" type="info" size="medium">赞助作者</n-tag>
      </span>
    </n-card>

    <n-drawer :show="isShow" v-model:show="isShow" :width="402" placement="right">
      <n-drawer-content title="支持作者" closable>
        <n-alert :show-icon="false">
          <div class="flex-box">
          <p style="color:#666; padding: 30px;">
            如果本软件对您有帮助，请赞助作者<br>
            如有定制功能的需求，欢迎咨询...
          </p>
          <img class="pay" src="https://upsort.com/pay/weixin.png"  alt="微信支付"/>
          <br />
          <img class="pay" src="https://upsort.com/pay/zhifubao.png"  alt="微信支付"/>
        </div>
        </n-alert>
        <template #footer>
          <div class="flex-footer"></div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.card{
  display: flex;
  margin-bottom: 10px;
  min-width: 0;
  gap: 20px;
}
.pay{
  width: 300px;
  padding: 20px;
}
.flex-box{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.path-input-group {
  flex: 1;
  max-width: 500px;
}
</style>