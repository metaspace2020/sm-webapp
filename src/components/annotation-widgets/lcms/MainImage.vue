<template>
<el-row id="main-image-container">
    <xic-plot id="main-xic-plot"
                :intensityImgs="[annotation.isotopeImages[0]]"
                :graphColors="graphColors"
                :acquisitionGeometry="acquisitionGeometry">
    </xic-plot>

    <div class="xic-img-download" v-if="ableToSaveImage">
        <img src="../../../assets/download-icon.png"
             width="32px"
             title="Save visible region in PNG format"
             @click="saveImage"/>
    </div>
</el-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import * as domtoimage from 'dom-to-image';
import { schemeCategory10 as LegendColors } from 'd3';
import { saveAs } from 'file-saver';

import { browserSupportsDomToImage } from '../../../util';
import XicPlot from '../../XicPlot.vue';

@Component({
    name: 'main-image',
    components: { XicPlot }
})
export default class MainImage extends Vue {
    @Prop()
    annotation: any
    @Prop()
    acquisitionGeometry: any

    get graphColors(): string[] {
        return [LegendColors[0]];
    }

    get ableToSaveImage(): boolean {
      return browserSupportsDomToImage();
    }

    saveImage(): void {
        let node: any = document.getElementById('main-xic-plot');
        domtoimage
            .toBlob(node, {
                width: node.clientWidth,
                height: node.clientHeight
            })
            .then(blob => {
                saveAs(blob, `${this.annotation.id}.png`);
            });
    }
}
</script>

<style>
#main-image-container {
    font-size: 1rem;
    text-align: center;
}

.xic-img-download {
    margin-top: 10px;
    margin-right: 10px;
    z-index: 1;
    cursor: pointer;
    position: absolute;
    right: 0;
    top: 0;
}
</style>
