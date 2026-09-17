<script setup>
defineProps({ name: { type: String, required: true } })
const pfade = {
  links: 'm14 6-6 6 6 6M8 12h13',
  rechts: 'm10 6 6 6-6 6M3 12h13',
  unten: 'm6 9 6 6 6-6',
  plus: 'M12 4v16M4 12h16',
  kalender: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16',
  barcode: 'M3 5v14m3-14v14m3-14v14m4-14v14m2-14v14m3-14v14m3-14v14',
  training: 'M3 9v6m3-9v12m0-6h12m0-6v12m3-9v6',
  rang: 'm12 3 8 9-8 9-8-9 8-9Zm-4 9 4-4 4 4-4 4-4-4Z',
  loeschen: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6',
}
</script>

<template>
  <svg class="navigationssymbol" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path :d="pfade[name]" />
  </svg>
</template>
