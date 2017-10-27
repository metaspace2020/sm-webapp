 import { renderMolFormula } from '../util';
 import DatasetInfo from './DatasetInfo.vue';
 import AdductsInfo from './AdductsInfo.vue';
 import ImageLoader from './ImageLoader.vue';
 import IonImageSettings from './IonImageSettings.vue';
 import IsotopePatternPlot from './IsotopePatternPlot.vue';
 import Colorbar from './Colorbar.vue';
 import {annotationQuery} from '../api/annotation';
 import {opticalImageQuery} from '../api/dataset';
 import { encodeParams } from '../url';

 import Vue, { ComponentOptions } from 'vue';
 import { Store } from 'vuex';
 import { Component, Prop } from 'vue-property-decorator';
 import { Location } from 'vue-router';

 type ImagePosition = {
   zoom: number
   xOffset: number
   yOffset: number
 }

 type ImageSettings = {
   annotImageOpacity: number
   opticalSrc: string
   opacityMode: 'linear' | 'constant'
 }

 type ImageLoaderSettings = ImagePosition & ImageSettings;

 @Component({
   name: 'annotation-view',
   components: {
     DatasetInfo,
     AdductsInfo,
     ImageLoader,
     IonImageSettings,
     IsotopePatternPlot,
     Colorbar
   },
   apollo: {
     peakChartData: {
       query: annotationQuery,
       update: (data: any) => {
         const {annotation} = data;
         let chart = JSON.parse(annotation.peakChartData);
         chart.sampleData = {
           mzs: annotation.isotopeImages.map((im: any) => im.mz),
           ints: annotation.isotopeImages.map((im: any) => im.totalIntensity),
         };
         return chart;
       },
       variables(this: any): any {
         return {
           id: this.annotation.id
         };
       }
     },

     opticalImageUrl: {
       query: opticalImageQuery,
       variables(this: any): any {
         return {
           datasetId: this.annotation.dataset.id,
           zoom: this.imageLoaderSettings.zoom
         }
       },
       // assumes both image server and webapp are routed via nginx
       update: (data: any) => data.opticalImageUrl
     }
   }
 })
 export default class AnnotationView extends Vue {
   $store: Store<any>

   @Prop()
   annotation: any

   peakChartData: any
   opticalImageUrl: string

   get activeSections(): string[] {
     return this.$store.getters.settings.annotationView.activeSections;
   }

   get colormap(): string {
     return this.$store.getters.settings.annotationView.colormap;
   }

   get formattedMolFormula(): string {
     if (!this.annotation) return '';
     const { sumFormula, adduct, dataset } = this.annotation;
     return renderMolFormula(sumFormula, adduct, dataset.polarity);
   }

   get compoundsTabLabel(): string {
     if (!this.annotation) return '';
     return "Molecules (" + this.annotation.possibleCompounds.length + ")";
   }

   get imageOpacityMode(): 'linear' | 'constant' {
     return this.opticalImageUrl ? 'linear' : 'constant';
   }

   get permalinkHref(): Location {
     const filter: any = {
       datasetIds: [this.annotation.dataset.id],
       compoundName: this.annotation.sumFormula,
       adduct: this.annotation.adduct,
       fdrLevel: this.annotation.fdrLevel,
       database: this.$store.getters.filter.database,
       simpleQuery: ''
     };
     const path = '/annotations';
     const q = encodeParams(filter, path)
     return {query: q, path};
   }

   get imageLoaderSettings(): ImageLoaderSettings {
     return Object.assign({}, this.imagePosition, {
       annotImageOpacity: this.opticalImageUrl ? this.opacity : 1.0,
       opticalSrc: this.opticalImageUrl,
       opacityMode: this.imageOpacityMode
     });
   }

   opacity: number = 1.0

   imagePosition: ImagePosition = {
     zoom: 1,
     xOffset: 0,
     yOffset: 0
   }

   onSectionsChange(activeSections: string[]): void {
     // FIXME: this is a hack to make isotope images redraw
     // so that they pick up the changes in parent div widths
     this.$nextTick(() => {
       window.dispatchEvent(new Event('resize'));
     });

     this.$store.commit('updateAnnotationViewSections', activeSections)
   }

   onImageZoom(event: any): void {
     this.imagePosition.zoom = event.zoom;
   }

   onImageMove(event: any): void {
     this.imagePosition.xOffset = event.xOffset;
     this.imagePosition.yOffset = event.yOffset;
   }
}