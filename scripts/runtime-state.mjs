export default async function({frame}){return frame.evaluate(()=>({screen:window.glimmer.screen,player:window.glimmer.market.player,stamps:window.glimmer.state.stamps}));}
