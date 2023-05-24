<script lang="ts">
  import { onMount } from "svelte";

  import { drag } from "d3-drag";
  import { select } from "d3-selection";

  let canvasElement: HTMLCanvasElement;
  let canvasCtx: CanvasRenderingContext2D;

  let baseRootEl: HTMLDivElement;
  let inputEl: HTMLInputElement;
  let isDragging = false;
  let stopPoints: [number, number][] = [];
  let stopPointsLayer: [number, number][] = [];
  let lastTouch = 0;

  onMount(() => {
    baseRootEl = document.getElementById("canvas-root") as HTMLDivElement;
    if (!baseRootEl._data) baseRootEl._data = { image: null };
    if (baseRootEl.dataset.mode) {
      const mode = baseRootEl.dataset.mode;
    }
    canvasCtx = canvasElement.getContext("2d");
    inputEl = document.querySelector("#dxdysxsy textarea") as HTMLInputElement;
    select(canvasElement)
      .on("dblclick", handleDbClick)
      .on("touchstart", handleTouch)
      .call(dragHandler());
    baseRootEl.loadBase64Image = loadBase64Image;
    baseRootEl.resetStopPoints = resetStopPoints;
  });

  let lastTap = 0;
  function handleTouch(event: TouchEvent) {
    let currentTime = Date.now();
    if (currentTime - lastTap < 500) {
      const rect = canvasElement.getBoundingClientRect();
      const scaleX = canvasElement.width / rect.width;
      const scaleY = canvasElement.height / rect.height;
      const x = (event.touches[0].clientX - rect.left) * scaleX;
      const y = (event.touches[0].clientY - rect.top) * scaleY;
      updateStopPoints(x, y);
    }
    lastTap = currentTime;
  }
  function handleDbClick(event: MouseEvent | PointerEvent) {
    const rect = canvasElement.getBoundingClientRect();
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;
    const x = event.offsetX * scaleX;
    const y = event.offsetY * scaleY;
    updateStopPoints(x, y);
  }

  function updateStopPoints(x, y) {
    const filteredPoints = stopPoints.filter((p) => {
      return Math.sqrt((p[0] - x) ** 2 + (p[1] - y) ** 2) > 10;
    });
    if (filteredPoints.length < stopPoints.length) {
      stopPoints = filteredPoints;
    } else {
      stopPoints = stopPoints.concat([[x, y]]);
    }

    stopPointsLayer = stopPoints.map((p) => {
      return [p[0] / canvasElement.width, p[1] / canvasElement.height];
    });
  }
  function resetStopPoints() {
    stopPoints = [];
    stopPointsLayer = [];
  }
  async function loadBase64Image(base64img: string) {
    const img = new Image();
    img.src = base64img;
    img.onload = () => {
      canvasCtx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
    };
  }
  function dragHandler() {
    let lastX = 0;
    let lastY = 0;
    function dragstarted(event: Event) {
      const rect = canvasElement.getBoundingClientRect();
      const scaleX = canvasElement.width / rect.width;
      const scaleY = canvasElement.height / rect.height;
      const x = event.x * scaleX;
      const y = event.y * scaleY;
      lastX = x;
      lastY = y;

      isDragging = true;
    }
    function dragged(event: Event) {
      const rect = canvasElement.getBoundingClientRect();
      const scaleX = canvasElement.width / rect.width;
      const scaleY = canvasElement.height / rect.height;
      const x = event.x * scaleX;
      const y = event.y * scaleY;
      const startX = event.subject.x * scaleX;
      const startY = event.subject.y * scaleY;

      let dx = Math.floor(x - startX);
      let dy = Math.floor(y - startY);
      const sx = Math.floor(startX);
      const sy = Math.floor(startY);

      dx = Math.sign(dx) * Math.min(Math.abs(dx), 255);
      dy = Math.sign(dy) * Math.min(Math.abs(dy), 255);

      const value = JSON.stringify({
        dx,
        dy,
        sx,
        sy,
        stopPoints,
      });
      // only update if the distance is greater than 10px
      if (Math.sqrt((lastX - x) ** 2 + (lastY - y) ** 2) > 5) {
        updateElement(value, inputEl);
        console.log("dragged", value);
        lastX = x;
        lastY = y;
      }
    }

    function dragended(event: Event) {
      isDragging = false;
    }
    return drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
  function updateElement(value: string, element: HTMLInputElement) {
    element.value = value;
    const event = new CustomEvent("input");
    element.dispatchEvent(event);
  }
</script>

<div class="relative container">
  <canvas
    class="w-full border-2 border-gray-200 {isDragging
      ? 'cursor-move'
      : 'cursor-pointer'}"
    bind:this={canvasElement}
    width="256"
    height="256"
  />
  <div
    class="absolute top-0 left-0 w-full h-full pointer-events-none touch-events-none"
  >
    {#each stopPointsLayer as pt}
      <div
        class="absolute w-3 h-3 rounded-full bg-cyan-500 -translate-x-1/2 -translate-y-1/2"
        style="top: {pt[1] * 100}%; left: {pt[0] * 100}%;"
      />
    {/each}
  </div>
</div>

<style lang="postcss" scoped>
  canvas {
    @apply rounded-lg shadow-sm;
  }
  .capture-btn {
    @apply text-black font-bold z-10 bg-slate-50 rounded-lg px-2 py-1 shadow-sm hover:bg-cyan-100;
  }
  .container :global(*) {
    color: black !important;
  }
</style>
