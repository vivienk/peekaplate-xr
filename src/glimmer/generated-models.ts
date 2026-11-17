import { AssetType } from '@iwsdk/core';
import index from './generated-model-index.json';
import prepared from './generated-portions.json';
export interface GeneratedModel {dish_id:string;key:string;file:string;source_sha256:string;cutout_sha256:string;sha256:string;size_bytes:number;provider:string;reviewed_for_preview:boolean;calibrated:boolean}
/** Compiled preview catalogue. Match source identity so an old dish model cannot survive a photo change. */
export function acceptedModels(models:GeneratedModel[]){return models.filter(m=>{
 const source=prepared[m.dish_id as keyof typeof prepared];
 return !!source&&m.key===source.key&&m.source_sha256===source.source_sha256&&m.cutout_sha256===source.cutout_sha256&&m.provider==='tripo'&&m.reviewed_for_preview===true&&m.calibrated===false&&/^[a-f0-9]{64}$/.test(m.sha256)&&m.file===`${m.key}-${m.sha256.slice(0,16)}.glb`&&Number.isInteger(m.size_bytes)&&m.size_bytes>28&&m.size_bytes<=50_000_000;
 });}
const models=acceptedModels(index.models);
export const generatedModelId=(id:string)=>models.some(m=>m.dish_id===id)?`tripo-dish-${models.find(m=>m.dish_id===id)!.key}`:undefined;
export const generatedAssets=Object.fromEntries(models.map(m=>[`tripo-dish-${m.key}`,{type:AssetType.GLTF,url:`${import.meta.env.BASE_URL}generated-models/${m.file}`,name:`Tripo dish · ${m.dish_id}`,priority:'lazy' as const}]));
