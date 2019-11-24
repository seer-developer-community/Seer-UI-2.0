import React from "react";
import {Link} from "react-router/es";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import PriceStatWithLabel from "./PriceStatWithLabel";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {ChainStore} from "seerjs/es";
import ExchangeHeaderCollateral from "./ExchangeHeaderCollateral";
import utils from "../../lib/common/utils";
import { Row, Col } from 'antd';

export default class ExchangeHeader extends React.Component {

    constructor() {
        super();

        this.state = {
            volumeShowQuote: true
        };
    }

    shouldComponentUpdate(nextProps) {
        if (!nextProps.marketReady)
            return false;
        return true;
    }

    _addMarket(quote, base) {
        let marketID = `${quote}_${base}`;
        if (!this.props.starredMarkets.has(marketID)) {
            SettingsActions.addStarMarket(quote, base);
        } else {
            SettingsActions.removeStarMarket(quote, base);
        }
    }

    changeVolumeBase() {
        this.setState({
            volumeShowQuote: !this.state.volumeShowQuote
        });
    }

    render() {
        const {quoteAsset, baseAsset, starredMarkets, hasPrediction, feedPrice,
            showCallLimit, lowestCallPrice, marketReady, latestPrice,
            marketStats, showDepthChart, account} = this.props;

        const baseSymbol = baseAsset.get("symbol");
        const quoteSymbol = quoteAsset.get("symbol");

        // Favorite star
        const marketID = `${quoteSymbol}_${baseSymbol}`;

        // Market stats
        const dayChange = marketStats.get("change");

        const dayChangeClass = parseFloat(dayChange) === 0 ? "" : parseFloat(dayChange) < 0 ? "negative" : "positive";
        const volumeBase = marketStats.get("volumeBase");
        const volumeQuote = marketStats.get("volumeQuote");
        const dayChangeWithSign = (dayChange > 0) ? "+" + dayChange : dayChange;

        const volume24h = this.state.volumeShowQuote ? volumeQuote : volumeBase;
        const volume24hAsset = this.state.volumeShowQuote ? quoteAsset : baseAsset;

        let showCollateralRatio = false;

        const quoteId = quoteAsset.get("id");
        const baseId = baseAsset.get("id");

        const lookForBitAsset = (quoteId === "1.3.0") ? baseId : (baseId === "1.3.0" ? quoteId : null);
        const possibleBitAsset = lookForBitAsset ? ChainStore.getAsset(lookForBitAsset) : null;
        const isBitAsset = possibleBitAsset ? !!possibleBitAsset.get("bitasset") : false;
        let collOrderObject = "";
        let settlePrice = null;

        if (isBitAsset) {

            if (account.toJS && account.has("call_orders")) {

                const call_orders = account.get("call_orders").toJS();

                for (let i = 0; i < call_orders.length; i++) {

                    let callID = call_orders[i];

                    let position = ChainStore.getObject(callID);
                    let debtAsset = position.getIn(["call_price", "quote", "asset_id"]);

                    if (debtAsset === lookForBitAsset) {
                        collOrderObject = callID;
                        showCollateralRatio = true;
                        break;
                    }
                };
            }

            /* Settlment Offset */
            let settleAsset = baseAsset.get("id") == "1.3.0" ? quoteAsset : quoteAsset.get("id") == "1.3.0" ? baseAsset : null;

            if(settleAsset) {
                let offset_percent = settleAsset.getIn(["bitasset", "options"]).toJS().force_settlement_offset_percent;
                settlePrice = baseAsset.get("id") == "1.3.0" ? feedPrice.toReal()/(1 + (offset_percent / 10000)) : feedPrice.toReal()*(1 + (offset_percent / 10000))
            }
        }

        const translator = require("counterpart");
        const labelStyle = {fontSize:14,color:"#666"};
        const valStyle = {fontSize:16,color:"#333"};

        let last_price = utils.price_text(latestPrice ? latestPrice.full : 0, quoteAsset, baseAsset);
        let day_volume = utils.format_volume(volume24h);

        return (
            <div>
                <Row>
                    <Col span={2}>
                        {!hasPrediction ? (
                            <div>
                                <Link to={`/asset/${quoteSymbol}`} className="asset-prefix" style={{fontSize:18,fontWeight:"bold"}}><AssetName name={quoteSymbol} replace={true}/></Link>
                                <span style={{padding:"0px"}}>/</span>
                                <Link to={`/asset/${baseSymbol}`} className="asset-prefix" style={{fontSize:18,fontWeight:"bold"}}><AssetName name={baseSymbol} replace={true}/></Link>
                            </div>
                        ) : (
                            <a className="market-symbol" style={{fontSize:18,fontWeight:"bold"}}>
                                <span>{`${quoteSymbol} : ${baseSymbol}`}</span>
                            </a>
                        )}
                    </Col>
                  <Col span={1}>
                    <Link onClick={() => { this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol")); }}
                          data-intro={translator.translate("walkthrough.favourite_button")}>
                      {
                        starredMarkets.has(marketID) ? <svg className="icon" aria-hidden="true" style={{width:"16px",height:"16px"}}>
                            <use xlinkHref="#icon-shoucang-checked"></use>
                          </svg>:
                          <i className="iconfont icon-shoucang" style={{color:"#CCC"}}></i>
                      }
                    </Link>
                  </Col>
                    <Col span={2} className="current-price right">
                      {!marketReady ? 0 : last_price}
                    </Col>
                    <Col span={10}>
                        <div style={{textAlign:"right",display:"none"}}>
                              <span className="clickable" onClick={this.props.onToggleCharts} style={{fontSize:14,color:"#449E7B",fontWeight:"bold"}}>
                            {!showDepthChart ?
                                <Translate
                                    content="exchange.order_depth"
                                    data-intro={translator.translate("walkthrough.depth_chart")}
                                /> : <Translate
                                content="exchange.price_history"
                                data-intro={translator.translate("walkthrough.price_chart")}
                            />}
                              </span>
                        </div>
                    </Col>

                    <Col span={3} className="right">
                        <Translate style={labelStyle} content="exchange.latest" />
                    </Col>
                    <Col span={3} className="right">
                        <Translate style={labelStyle} content="account.hour_24" />
                    </Col>
                    <Col span={3} className="right">
                        <Translate style={labelStyle} content="exchange.volume_24" onClick={this.changeVolumeBase.bind(this)} className="clickable"/>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <div className="label-actions">
                            <span style={{fontSize:14,color:"#666"}}>TRADING PAIR</span>
                            {/*<Translate component="span" style={{padding: "5px 0 0 5px",fontSize:14,color:"#666"}} className="stat-text" content="exchange.trading_pair" />*/}
                        </div>
                    </Col>
                    <Col span={1}>
                      <Link onClick={() => {
                        MarketsActions.switchMarket();
                      }}
                            to={`/market/${baseSymbol}_${quoteSymbol}`}
                            data-intro={translator.translate("walkthrough.switch_button")}>
                        <i className="iconfont icon-qiehuan" style={{color:"#CCC"}}></i>
                      </Link>
                    </Col>
                    <Col span={2} className="right">
                      <span style={{fontSize:"12px",color:"#999"}}> ￥0.31</span>
                    </Col>
                    <Col span={10}>
                    </Col>
                    <Col span={3} className="right">
                        <span style={valStyle}> {!marketReady ? 0 : last_price} <AssetName name={baseSymbol} /></span>
                    </Col>
                    <Col span={3} className="right">
                        <span style={{...valStyle,color:"#4EA382"}}> {marketReady ? dayChangeWithSign : 0}%</span>
                    </Col>
                    <Col span={3} className="right">
                        <span style={valStyle} onClick={this.changeVolumeBase.bind(this)} className="clickable"> {!marketReady ? 0 : day_volume} <AssetName name={volume24hAsset.get("symbol")} /></span>
                    </Col>
                </Row>
                {/*<div className="grid-block shrink no-padding overflow-visible">*/}
                
                
                
                
                  {/*<table width="100%">*/}
                      {/*<tbody>*/}
                        {/*<tr height="26px">*/}
                          {/*<td style={{width:100}}>*/}
                
                          {/*</td>*/}
                          {/*<td width="115px">*/}
                
                          {/*</td>*/}
                          {/*<td width="187px">*/}
                
                          {/*</td>*/}
                          {/*<td width="131px">*/}
                
                          {/*</td>*/}
                          {/*<td width="131px">*/}
                
                          {/*</td>*/}
                          {/*<td rowSpan={2}>*/}
                
                          {/*</td>*/}
                        {/*</tr>*/}
                        {/*<tr height="26px">*/}
                          {/*<td>*/}
                
                          {/*</td>*/}
                          {/*<td>*/}
                
                          {/*</td>*/}
                          {/*<td>*/}
                
                          {/*</td>*/}
                          {/*<td>*/}
                
                          {/*</td>*/}
                          {/*<td>*/}
                
                          {/*</td>*/}
                          {/*/!*<td>*!/*/}
                            {/*/!*{(volumeBase >= 0) ? <PriceStatWithLabel ignoreColorChange={true} onClick={this.changeVolumeBase.bind(this)} ready={marketReady} decimals={0} volume={true} price={volume24h} className="hide-order-2 clickable" base={volume24hAsset} market={marketID} content="exchange.volume_24"/> : null}*!/*/}
                            {/*/!*{!hasPrediction && feedPrice ?*!/*/}
                              {/*/!*<PriceStatWithLabel ignoreColorChange={true} toolTip={counterpart.translate("tooltip.settle_price")} ready={marketReady} className="hide-order-3" price={feedPrice.toReal()} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.feed_price"/> : null}*!/*/}
                            {/*/!*{!hasPrediction && feedPrice ?*!/*/}
                              {/*/!*<PriceStatWithLabel ignoreColorChange={true} toolTip={counterpart.translate("tooltip.settle_price")} ready={marketReady} className="hide-order-4" price={settlePrice} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.settle"/> : null}*!/*/}
                            {/*/!*{showCollateralRatio ?<ExchangeHeaderCollateral object={collOrderObject} account={account}/>:null}*!/*/}
                            {/*/!*{lowestCallPrice && showCallLimit ?*!/*/}
                              {/*/!*<PriceStatWithLabel toolTip={counterpart.translate("tooltip.call_limit")} ready={marketReady} className="hide-order-5 is-call" price={lowestCallPrice} quote={quoteAsset} base={baseAsset} market={marketID} content="explorer.block.call_limit"/> : null}*!/*/}
                
                            {/*/!*{feedPrice && showCallLimit ?<PriceStatWithLabel toolTip={counterpart.translate("tooltip.margin_price")} ready={marketReady} className="hide-order-6 is-call" price={feedPrice.getSqueezePrice({real: true})} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.squeeze"/> : null}*!/*/}
                          {/*/!*</td>*!/*/}
                        {/*</tr>*/}
                      {/*</tbody>*/}
                  {/*</table>*/}
                {/*</div>*/}
            </div>
                );
            }
        }
