<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const editorRef = ref<HTMLElement | null>(null)
let quill: any = null
let isUpdating = false

// โหลด Quill จาก CDN
function loadQuill(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).Quill) { resolve(); return }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  await loadQuill()
  const Quill = (window as any).Quill

  quill = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: props.placeholder || 'เล่าประสบการณ์การเดินทางของคุณ...',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        [{ align: [] }],
        ['clean']
      ]
    }
  })

  // โหลดค่าเดิม
  if (props.modelValue) {
    quill.clipboard.dangerouslyPasteHTML(props.modelValue)
  }

  // emit เมื่อ content เปลี่ยน
  quill.on('text-change', () => {
    if (isUpdating) return
    const html = quill.root.innerHTML
    const isEmpty = quill.getText().trim().length === 0
    emit('update:modelValue', isEmpty ? '' : html)
  })
})

// sync จาก parent (เช่น insertImage)
watch(() => props.modelValue, (val) => {
  if (!quill) return
  const current = quill.root.innerHTML
  if (val !== current) {
    isUpdating = true
    quill.clipboard.dangerouslyPasteHTML(val || '')
    isUpdating = false
  }
})

// method สำหรับ insert image tag
function insertImage(index: number) {
  if (!quill) return
  const range = quill.getSelection(true)
  const pos = range ? range.index : quill.getLength()
  quill.insertText(pos, '\n', 'user')
  quill.insertEmbed(pos + 1, 'image', `[IMAGE:${index}]`, 'user')
  quill.setSelection(pos + 2)
}

defineExpose({ insertImage })

onBeforeUnmount(() => { quill = null })
</script>

<template>
  <div class="rte-wrapper" :class="{ disabled }">
    <div ref="editorRef" class="rte-editor"></div>
  </div>
</template>

<style>
/* Global — Quill CSS override */
.rte-wrapper .ql-toolbar {
  border: 1px solid var(--border-color) !important;
  border-bottom: none !important;
  border-radius: 10px 10px 0 0 !important;
  background: var(--bg-tertiary) !important;
  font-family: 'Kanit', sans-serif !important;
  padding: 8px 12px !important;
}

.rte-wrapper .ql-container {
  border: 1px solid var(--border-color) !important;
  border-radius: 0 0 10px 10px !important;
  font-size: 1rem !important;
  font-family: 'Kanit', sans-serif !important;
  background: var(--bg-card) !important;
  min-height: 280px;
}

.rte-wrapper .ql-editor {
  min-height: 280px;
  line-height: 1.8;
  color: var(--text-primary) !important;
  padding: 16px 20px !important;
}

.rte-wrapper .ql-editor.ql-blank::before {
  color: var(--text-muted) !important;
  font-style: normal !important;
  font-family: 'Kanit', sans-serif !important;
}

.rte-wrapper .ql-editor h2 { font-size: 1.5rem; font-weight: 700; margin: 20px 0 10px; color: var(--text-primary); }
.rte-wrapper .ql-editor h3 { font-size: 1.2rem; font-weight: 600; margin: 16px 0 8px; color: var(--text-primary); }
.rte-wrapper .ql-editor p { margin-bottom: 10px; }
.rte-wrapper .ql-editor ul, .rte-wrapper .ql-editor ol { padding-left: 20px; margin-bottom: 10px; }
.rte-wrapper .ql-editor li { margin-bottom: 4px; }
.rte-wrapper .ql-editor blockquote {
  border-left: 4px solid var(--accent);
  background: var(--accent-light);
  padding: 10px 16px;
  margin: 12px 0;
  border-radius: 0 8px 8px 0;
  color: var(--text-secondary);
}

/* Toolbar icons color */
.rte-wrapper .ql-toolbar .ql-stroke { stroke: var(--text-secondary) !important; }
.rte-wrapper .ql-toolbar .ql-fill { fill: var(--text-secondary) !important; }
.rte-wrapper .ql-toolbar button:hover .ql-stroke,
.rte-wrapper .ql-toolbar button.ql-active .ql-stroke { stroke: var(--accent) !important; }
.rte-wrapper .ql-toolbar button:hover .ql-fill,
.rte-wrapper .ql-toolbar button.ql-active .ql-fill { fill: var(--accent) !important; }
.rte-wrapper .ql-toolbar .ql-picker-label { color: var(--text-secondary) !important; }
.rte-wrapper .ql-toolbar .ql-picker-options { background: var(--bg-card) !important; border-color: var(--border-color) !important; }
.rte-wrapper .ql-toolbar .ql-picker-item { color: var(--text-primary) !important; }

.rte-wrapper.disabled .ql-toolbar,
.rte-wrapper.disabled .ql-container { opacity: 0.6; pointer-events: none; }

/* Focus state */
.rte-wrapper .ql-container.ql-snow:focus-within {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.15) !important;
}
</style>
