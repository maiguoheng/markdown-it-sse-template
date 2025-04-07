<script setup>
import { onMounted, ref } from 'vue'
import SSERender from './components/SSERender.vue'
const isIFrame = ref(window.location.href.includes('iframe=true'))
onMounted(() => {
  if (isIFrame.value) {
    window.addEventListener('message', (event) => {
      // 使用 DOMParser 解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(event.data, 'text/html');

      // 提取并执行脚本
      const scriptTags = doc.querySelectorAll('script');
      const scriptLoadQueue = []
      scriptTags.forEach((script) => {
        const scriptContent = script.textContent || script.text;
        if (script.src) {
          const scriptTag = document.createElement('script');
          scriptTag.src = script.src;
          scriptLoadQueue.push(new Promise((resolve, reject) => {
            scriptTag.onload = function(){
              console.error('script load')
              resolve()
            };
            scriptTag.onerror = reject;
          }))
          document.body.appendChild(scriptTag);
          return;
        }
        const newScript = document.createElement('script');
        newScript.textContent = scriptContent;// 等待所有外部脚本加载完成后再执行内联脚本
        Promise.all(scriptLoadQueue).then(() => {
          setTimeout(()=>{
            document.body.appendChild(newScript);
          })
        }).catch(e => {
          console.error('Script load error:', script.src, event);
        })
      });

      // 插入 HTML 内容（移除脚本标签）
      Promise.all(scriptLoadQueue).then(() => {
        const bodyContent = doc.body.innerHTML;
        document.body.innerHTML = bodyContent;
      }).catch(e => {
        console.error('promise err', e);
      })
    })
  }
})
</script>

<template lang="pug">
  SSERender(v-if="!isIFrame")
  div(v-else) test iframe
</template>

<style>
@import url('./assets/style/mindmap.styl');

.logo {
  height: 0.6rem;
  padding: 0.15rem;
  will-change: filter;
  transition: filter 300ms;
}
</style>
