<template>
    <div class="l_verify_wrapper" 
        :style="{ 'width': width + 'px', 'margin': '0 auto', 'display': visible ? '' : 'none' }"
        @mouseup="handleDragEnd"
        @mousemove="handleDragMove"
        @touchmove="handleDragMove"
        @touchend="handleDragEnd"
    >
        <div class="l_verify_canvasArea">
            <canvas ref="canvasRef" :width="width" :height="height"></canvas>
            <canvas ref="blockRef" class="l_verify_block" :width="width" :height="height" @mousedown="handleDragStart"
            @touchstart="handleDragStart"></canvas>
            <div :class="sliderClass" :style="{'pointerEvents': isLoading ? 'none' : 'auto', 'width': width + 'px'}">
                <div class="l_verify_sliderMark" :style="{'width': sliderLeft + 'px' }">
                    <div class="slider" :style="{'left': sliderLeft + 'px' }" @mousedown="handleDragStart" @touchstart="handleDragStart">
                        <div class="sliderIcon">&rarr;</div>
                    </div>
                </div>
                <div class="sliderText" onselectstart="return false">{{ textTip }}</div>
            </div>
            <div class="refreshIcon" @click="handleRefresh"></div>
            <div v-show="isLoading" class="loadingContainer" :style="{'width': width + 'px','height': height + 'px'}">
                <div class="loadingIcon"></div>
                <span onselectstart="return false">加载中...</span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { getRandomNumberByRange, sum, square } from './tool'
    import { ref } from 'vue'
    const props = defineProps({
        width: {
            type: Number,
            default: 320
        },
        height: {
            type: Number,
            default: 160
        },
        l: {
            type: Number,
            default: 42
        },
        r: {
            type: Number,
            default: 9
        },
        visible: {
            type: Boolean,
            default: true
        },
        text: {
            type: [String, HTMLElement],
            default: '向右滑动填充拼图'
        },
        refreshIcon: {
            type: String,
            default: '-'
        },
        imgUrl: {
            type: String,
            default: ''
        },
        onSuccess: {
            type: Function,
            default: ():void => {}
        },
        onFail: {
            type: Function,
            default: ():void => {}
        },
        onRefresh: {
            type: Function,
            default: ():void => {}
        }
    })

    const isLoading = ref(false)
    const sliderLeft = ref(0)
    const sliderClass = ref('l_verify_slider')
    const textTip = ref<any>(props.text)
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const blockRef = ref<HTMLCanvasElement | null>(null)
    const imgRef = ref<any>(null)
    const isMouseDownRef = ref(false)
    const trailRef = ref<number[]>([])
    const originXRef = ref(0)
    const originYRef = ref(0)
    const xRef = ref(0)
    const yRef = ref(0)
    const PI = Math.PI
    const L = props.l + props.r * 2 + 3
    const SILDERWIDTH = 38
    const drawPath = (ctx: any, x: number, y: number,  operation: 'fill' | 'clip') => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x + props.l / 2, y - props.r + 2, props.r, 0.72 * PI, 2.26 * PI);
        ctx.lineTo(x + props.l, y);
        ctx.arc(x + props.l + props.r - 2, y + props.l / 2, props.r, 1.21 * PI, 2.78 * PI);
        ctx.lineTo(x + props.l, y + props.l);
        ctx.lineTo(x, y + props.l);
        ctx.arc(x + props.r - 2, y + props.l / 2, props.r + 0.4, 2.76 * PI, 1.24 * PI, true);
        ctx.lineTo(x, y);
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
        ctx.globalCompositeOperation = 'destination-over';
        operation === 'fill' ? ctx.fill() : ctx.clip();
    }

    const getRandomImgSrc = () => {
      return ( props.imgUrl || `https://picsum.photos/id/${getRandomNumberByRange( 0, 1084 )}/${props.width}/${props.height}`
      );
    };

    const createImg = (onload: any) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = onload
        img.onerror = () => {
            (img as any).setSrc(getRandomImgSrc())
        }
        (img as any).setSrc = (src: string) => {
            const isIE = window.navigator.userAgent.indexOf('Trident') > -1
            if(isIE) {
                const XHR = new XMLHttpRequest()
                XHR.onload = function(e: any) {
                    const file = new FileReader()
                    file.readAsDataURL(e.target.response)
                    file.onload = (val) => {
                        img.src = (val?.target?.result as string)
                    }
                }
                XHR.open('get', src)
                XHR.responseType = 'blob'
                XHR.send()
            }else {
                img.src = src
            }
        }
        (img as any).setSrc(getRandomImgSrc())
        return img
    }

    const draw = (img: HTMLImageElement) => {
        const canvasCtx = canvasRef.value?.getContext('2d')
        const blockCtx  = blockRef.value?.getContext('2d')
        xRef.value = getRandomNumberByRange(L + 10, props.width - (L + 10))
        yRef.value = getRandomNumberByRange(10 + props.r * 2, props.height - (L + 10))
        drawPath(canvasCtx, xRef.value, yRef.value, 'fill')
        drawPath(blockCtx, xRef.value, yRef.value, 'clip')

        canvasCtx?.drawImage(img, 0, 0, props.width, props.height)
        blockCtx?.drawImage(img, 0, 0, props.width, props.height)

        const y1 = yRef.value - props.r * 2 - 1
        const ImageDataVal = blockCtx?.getImageData(xRef.value - 3, y1, L, L)
        blockRef.value!.width = L;
        blockCtx?.putImageData((ImageDataVal as ImageData), 0, y1);
    }

    const initImg = () => {
        const img = createImg(() => {
            isLoading.value = false
            draw(img)
        })
        imgRef.value = img
    }

    const reset = () => {
        const canvasCtx = canvasRef.value?.getContext('2d')
        const blockCtx = blockRef.value?.getContext('2d')

        sliderLeft.value = 0
        sliderClass.value = 'l_verify_slider'
        blockRef.value!.width = props.width
        blockRef.value!.style.left = 0 + 'px'

        canvasCtx?.clearRect(0, 0, props.width, props.height)
        blockCtx?.clearRect(0, 0, props.width, props.height)

        isLoading.value = true
        imgRef.value.setSrc(getRandomImgSrc())

    }

    const handleRefresh = () => {
        reset()
        typeof props.onRefresh === 'function' && props.onRefresh()
    }

    const verify = () => {
        const arr = trailRef.value
        const average = arr.reduce(sum) / arr.length
        const deviations = arr.map((x) => x - average)
        const stddev = Math.sqrt(deviations.map(square).reduce(sum) / arr.length)
        const left = parseInt(blockRef.value!.style.left)
        return {
            spliced: Math.abs(left - xRef.value) < 10,
            verified: stddev !== 0
        }
    }

    const handleDragStart = (e: any) => {
        originXRef.value = e.clientX || e.touches[0].clientX
        originYRef.value = e.clientY || e.touches[0].clientY
        isMouseDownRef.value = true
    }

    const handleDragMove = (e: any) => {
        if(!isMouseDownRef.value) return false
        e.preventDefault();
        const clientX = e.clientX || e.touches[0].clientX
        const clientY = e.clientY || e.touches[0].clientY

        const deltaX = clientX - originXRef.value
        const deltaY = clientY - originYRef.value

        if(deltaX < 0 || deltaX + SILDERWIDTH > props.width) return false
        sliderLeft.value = deltaX
        const blockLeft = ((props.width - 40 - 20) / (props.width - 40)) * deltaX
        blockRef.value!.style.left = `${blockLeft}px`
        sliderClass.value = 'l_verify_slider l_verify_slider_active'
        trailRef.value.push(deltaY)
    }

    const handleDragEnd = (e: any) => {
        if(!isMouseDownRef.value) return false
        isMouseDownRef.value = false
        const clientX = e.clientX || e.touches[0] && e.touches[0].clientX
        if(clientX === originXRef.value) return false
        sliderClass.value = 'l_verify_slider'

        const { spliced, verified } = verify()
        if (spliced) {
            if (verified) {
                sliderClass.value = 'l_verify_slider l_verify_slider_success'
                typeof props.onSuccess === 'function' && props.onSuccess()
            } else {
                sliderClass.value = 'l_verify_slider l_verify_slider_fail'
                textTip.value = '请再试一次'
                reset();
            }
        } else {
                sliderClass.value = 'l_verify_slider l_verify_slider_fail'
                typeof props.onFail === 'function' && props.onFail();
                setTimeout(reset.bind(null), 1000);
        }
    }

    initImg()
</script>
<style scoped>
.l_verify_wrapper{
    position: relative;
}
.l_verify_block{
    position: absolute;
    top: 0;
    left: 0;
    cursor: pointer;
    cursor: grab;
}
.l_verify_block:active{
    cursor: grabbing;
}
.l_verify_slider{
    position: relative;
    text-align: center;
    width: 320px;
    height: 42px;
    line-height: 42px;
    margin-top: 15px;
    background: #f7f9fa;
    color: #45494c;
    border: 1px solid #e4e7eb;
}
.l_verify_slider_active .slider {
    height: 40px;
    top: -1px;
    border: 1px solid #486cd6;
}
.l_verify_slider_active .l_verify_sliderMark{
    height: 40px;
    border-width: 1px;
}
.l_verify_slider_success .slider {
    height: 40px;
    top: -1px;
    border: 1px solid #0db87f;
    background-color: #0ca14a !important;
}
.l_verify_slider_success .l_verify_sliderMark {
    height: 40px;
    border: 1px solid #0db87f;
    background-color: #d2f4ef;
}
.l_verify_slider_success .sliderIcon {
    background-position: 0 -26px !important;
    color: #fff;
}
.l_verify_slider_fail .sliderMask {
    height: 40px;
    border: 1px solid #f57a7a;
    background-color: #fce1e1;
}
.l_verify_slider_fail .sliderIcon {
    top: 14px;
    background-position: 0 -82px !important;
}
.l_verify_slider_active .sliderText,
.l_verify_slider_success .sliderText,
.l_verify_slider_fail .sliderText {
    display: none;
    user-select: unset;
}
.l_verify_sliderMark {
    position: absolute;
    left: 0;
    top: 0;
    height: 40px;
    border: 0 solid #486cd6;
    background: #d1e9fe;
}
.slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    background: #fff;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
    transition: background 0.2s linear;
    cursor: pointer;
    cursor: grab;
}
.slider:active {
    cursor: grabbing;
  }

.slider:hover {
    background: #486cd6;
}   

.sliderIcon {
    font-size: 18px;
    color: #000;
}

.slider:hover .sliderIcon {
    color: #fff;
}

.refreshIcon {
    position: absolute;
    right: 5px;
    top: 5px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    background-size: 32px;
    background: url(http://cdn.dooring.cn/dr/icon12.png);
    background-size: 32px;
}

.loadingContainer {
    position: absolute;
    left: 0;
    top: 0;
    width: 310px;
    height: 155px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: #45494c;
    z-index: 2;
    background: #edf0f2;
}

.loadingIcon {
    width: 32px;
    height: 32px;
    margin-bottom: 10px;
    background: url(http://cdn.dooring.cn/dr/icon12.png);
    background-size: 32px;
    animation: loading-icon-rotate 0.8s linear infinite;
}

@keyframes loading-icon-rotate {
    from {
        transform: rotate(0);
    }
    to {
        transform: rotate(360deg);
    }
}

</style>