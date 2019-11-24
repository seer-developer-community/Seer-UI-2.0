import React from "react";
import {PropTypes} from "react";
import classNames from "classnames";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import PriceText from "../Utility/PriceText";
import AssetName from "../Utility/AssetName";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import SimpleDepositBlocktradesBridge from "../Dashboard/SimpleDepositBlocktradesBridge";
import {Asset} from "common/MarketClasses";
import ExchangeInput from "./ExchangeInput";
import assetUtils from "common/asset_utils";
import Icon from "../Icon/Icon";
import { Slider } from 'antd';

class BuySell extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject,
        type: PropTypes.string,
        amountChange: PropTypes.func.isRequired,
        priceChange: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired
    };

    static defaultProps = {
        type: "bid"
    };

    shouldComponentUpdate(nextProps) {
        return (
                nextProps.amount !== this.props.amount ||
                nextProps.onBorrow !== this.props.onBorrow ||
                nextProps.total !== this.props.total ||
                nextProps.currentPrice !== this.props.currentPrice ||
                nextProps.price !== this.props.price ||
                nextProps.balance !== this.props.balance ||
                nextProps.account !== this.props.account ||
                nextProps.className !== this.props.className ||
                (nextProps.fee && this.props.fee ? nextProps.fee.ne(this.props.fee) : false) ||
                nextProps.isPredictionMarket !== this.props.isPredictionMarket ||
                nextProps.feeAsset !== this.props.feeAsset ||
                nextProps.isOpen !== this.props.isOpen ||
                nextProps.hasFeeBalance !== this.props.hasFeeBalance
            );
    }

    _addBalance(balance) {
        if (this.props.type === "bid") {
            this.props.totalChange({target: {value: balance.getAmount({real: true}).toString()}});
        } else {
            this.props.amountChange({target: {value: balance.getAmount({real: true}).toString()}});
        }
    }

    _setPrice(price) {
        this.props.priceChange({target: {value: price.toString()}});
    }

    _onDeposit(e) {
        e.preventDefault();
        this.refs.deposit_modal.show();
    }

    _onBuy(e) {
        e.preventDefault();
        this.refs.bridge_modal.show();
    }

    _sliderFormatter(value) {
        return `${value}%`;
    }

    _onSliderChange(balanceAmount,value){
      let price = this.props.price || 0;
      let balance = balanceAmount.getAmount({real: true});

      if(!price > 0 || !balance > 0){
        return;
      }

      let maxAmount = balance / price;
      let amount = maxAmount * (value / 100);
       if(this.props.amountChange){
         this.props.amountChange({
           target:{
             value:`${amount}`
           }
         })
       }
    }

    render() {
        let {type, quote, base, amountChange, fee, isPredictionMarket,
            priceChange, onSubmit, balance, totalChange,
            balancePrecision, currentPrice, currentPriceObject,
            feeAsset, feeAssets, hasFeeBalance, backedCoin} = this.props;
        let amount, price, total;
        let caret = this.props.isOpen ? <span>&#9660;</span> : <span>&#9650;</span>;

        amount = this.props.amount || "";
        price = this.props.price || "";
        total = this.props.total || "";

        let balanceAmount = new Asset({amount: balance ? balance.get("balance") : 0, precision: balancePrecision, asset_id: this.props.balanceId});

        const maxBaseMarketFee = new Asset({
            amount: base.getIn(["options", "max_market_fee"]),
            asset_id: base.get("asset_id"),
            precision: base.get("precision")
        });
        const maxQuoteMarketFee = new Asset({
            amount: quote.getIn(["options", "max_market_fee"]),
            asset_id: quote.get("asset_id"),
            precision: quote.get("precision")
        });
        const quoteFee = !amount ? 0 : Math.min(maxQuoteMarketFee.getAmount({real: true}), amount * quote.getIn(["options", "market_fee_percent"]) / 10000);
        const baseFee = !amount ? 0 : Math.min(maxBaseMarketFee.getAmount({real: true}), total * base.getIn(["options", "market_fee_percent"]) / 10000);
        const baseFlagBooleans = assetUtils.getFlagBooleans(base.getIn(["options", "flags"]));
        const quoteFlagBooleans = assetUtils.getFlagBooleans(quote.getIn(["options", "flags"]));


        const hasMarketFee = baseFlagBooleans["charge_market_fee"] || quoteFlagBooleans["charge_market_fee"];
        var baseMarketFee = baseFlagBooleans["charge_market_fee"] ? (
            <div className="grid-block no-padding buy-sell-row">
                <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                    <Translate content="explorer.asset.summary.market_fee" />:
                </div>
                <div className="grid-block small-5 no-margin no-overflow buy-sell-input">
                    <input disabled type="text" id="baseMarketFee" value={baseFee} autoComplete="off"/>
                </div>
                <div className="grid-block small-4 no-margin no-overflow buy-sell-box">
                    <AssetName noTip name={base.get("symbol")} />
                    <span
                        data-tip={counterpart.translate(
                            "tooltip.market_fee",
                            {
                                percent: base.getIn(["options", "market_fee_percent"]) / 100,
                                asset: base.get("symbol")
                            }
                        )
                        }
                        className="inline-block tooltip"
                    >
                        &nbsp;<Icon style={{position: "relative", top: 3}} name="question-circle" />
                    </span>
                </div>
            </div>
        ) : hasMarketFee ?
        <div className="grid-block no-padding buy-sell-row">
            <div style={{visibility: "hidden"}} className="grid-block small-3 no-margin no-overflow buy-sell-label">
                <Translate content="explorer.asset.summary.market_fee" />:
            </div>
        </div> : null;
        var quoteMarketFee = quoteFlagBooleans["charge_market_fee"] ? (
            <div className="grid-block no-padding buy-sell-row">
                <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                    <Translate content="explorer.asset.summary.market_fee" />:
                </div>
                <div className="grid-block small-5 no-margin no-overflow buy-sell-input">
                    <input disabled type="text" id="baseMarketFee" value={quoteFee} autoComplete="off"/>
                </div>
                <div className="grid-block small-4 no-margin no-overflow buy-sell-box">
                    <AssetName noTip name={quote.get("symbol")} />
                    <span
                        data-tip={counterpart.translate(
                            "tooltip.market_fee",
                            {
                                percent: quote.getIn(["options", "market_fee_percent"]) / 100,
                                asset: quote.get("symbol")
                            }
                        )
                        }
                        className="inline-block tooltip"
                    >
                        &nbsp;<Icon style={{position: "relative", top: 3}} name="question-circle" />
                    </span>
                </div>
            </div>
        ) : hasMarketFee ?
        <div className="grid-block no-padding buy-sell-row">
            <div style={{visibility: "hidden"}} className="grid-block small-3 no-margin no-overflow buy-sell-label">
                <Translate content="explorer.asset.summary.market_fee" />:
            </div>
        </div> : null;

        // if (!balanceAmount) {
        //     balanceAmount = 0;
        // }
        const isBid = type === "bid";
        let marketFee = isBid && quoteMarketFee ? quoteMarketFee : !isBid && baseMarketFee ? baseMarketFee : null;
        let hasBalance = isBid ? balanceAmount.getAmount({real: true}) >= parseFloat(total || 0) : balanceAmount.getAmount({real: true}) >= parseFloat(amount || 0);

        let buttonText = isPredictionMarket ? counterpart.translate("exchange.short") : isBid ? counterpart.translate("exchange.buy") : counterpart.translate("exchange.sell");
        let forceSellText = isBid ? counterpart.translate("exchange.buy") : counterpart.translate("exchange.sell");

        let noBalance = isPredictionMarket ? false : !(balanceAmount.getAmount() > 0 && hasBalance);

        let invalidPrice = !(price > 0);
        let invalidAmount = !(amount >0);

        let disabled = noBalance || invalidPrice || invalidAmount;

        let buttonClass = classNames("button ", type, {disabled: disabled});
        let balanceSymbol = isBid ? base.get("symbol") : quote.get("symbol");

        let disabledText = invalidPrice ? counterpart.translate("exchange.invalid_price") :
                           invalidAmount ? counterpart.translate("exchange.invalid_amount") :
                           noBalance ? counterpart.translate("exchange.no_balance") :
                           null;

        // Fee asset selection
        if( feeAssets[1] && feeAssets[1].getIn(["options", "core_exchange_rate", "quote", "asset_id"]) === "1.3.0" && feeAssets[1].getIn(["options", "core_exchange_rate", "base", "asset_id"]) === "1.3.0" ) {
            feeAsset = feeAssets[0];
            feeAssets.splice(1, 1);
        }
        let index = 0;
        let options = feeAssets.map(asset => {
            let {name, prefix} = utils.replaceName(asset.get("symbol"), asset.get("bitasset") && !asset.getIn(["bitasset", "is_prediction_market"]) && asset.get("issuer") === "1.2.0");
            return <option key={asset.get("id")} value={index++}>{prefix}{name}</option>;
        });

        // Subtract fee from amount to sell
        let balanceToAdd;

        if (feeAsset.get("symbol") === balanceSymbol) {
            balanceToAdd = balanceAmount.clone(balanceAmount.getAmount() - fee.getAmount());
        } else {
            balanceToAdd = balanceAmount;
        }

        let {name, prefix} = utils.replaceName(this.props[isBid ? "base" : "quote"].get("symbol"), !!this.props[isBid ? "base" : "quote"].get("bitasset"));
        let buyBorrowDepositName = (prefix ? prefix : "") + name;

        const translator = require("counterpart");

        let dataIntro = null;

        if (type === "bid") {
            dataIntro =translator.translate("walkthrough.buy_form");
        }

        if (type === "ask") {
            dataIntro =translator.translate("walkthrough.sell_form");
        }

        const marks = {
            0:"", 25:"",50:"", 70:"", 100:""
        };

        let sliderDisable = !hasBalance || invalidPrice;

        return (
            <div className={this.props.className} style={{}}>
                <div className="buy-sell-container" style={{height:"100%"}}>
                    <div style={{padding:"12px"}}>
                    <table style={{fontSize:"14px",width:"100%",color:"#666"}}>
                      <tr height="28px">
                        <td colSpan={2} style={{textAlign:"right"}}>
                            <AssetName name={balanceSymbol} />
                            <Translate content="transfer.balances" /> : &nbsp;
                            <span className="balances" onClick={this._addBalance.bind(this, balanceToAdd)}>
                                      {utils.format_number(balanceAmount.getAmount({real: true}), balancePrecision)}
                                  </span>
                        </td>
                      </tr>
                      <tr height="40px">
                        <td width="60px">
                          <Translate content={isBid ? "exchange.exchange_form.buy_price" : "exchange.exchange_form.sell_price"} />
                        </td>
                        <td>
                            <div className="grid-block buy-sell-row" style={{border:"1px solid #e7e7e7",width:"100%",height:30,lineHeight:"30px",overflow:"hidden",marginBottom:0,padding:"0 10px"}}>
                              <ExchangeInput id={`${type}Price`} value={price} onChange={priceChange} autoComplete="off" placeholder="0.0" style={{border:"none",height:"28px",margin:0,padding:0,fontSize:"12px"}}/>
                              <span style={{fontSize:"12px",color:"#666"}}>
                              <AssetName dataPlace="right" name={base.get("symbol")} />
                              &nbsp;/&nbsp;
                              <AssetName dataPlace="right" name={quote.get("symbol")} />
                              </span>
                            </div>
                        </td>
                      </tr>
                      <tr height="40px">
                        <td width="60px">
                          <Translate content={isBid ? "exchange.exchange_form.buy_amount" : "exchange.exchange_form.sell_amount"} />
                        </td>
                        <td>
                          <div className="grid-block buy-sell-row" style={{border:"1px solid #e7e7e7",width:"100%",height:30,lineHeight:"30px",overflow:"hidden",marginBottom:0,padding:"0 10px"}}>
                            <ExchangeInput id={`${type}Amount`} value={amount} onChange={amountChange} autoComplete="off" placeholder="0.0" style={{border:"none",height:"28px",margin:0,padding:0,fontSize:"12px"}}/>
                            <span style={{fontSize:"12px",color:"#666"}}>
                              <AssetName dataPlace="right" name={quote.get("symbol")} />
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr height="40px" style={{display:"none"}}>
                        <td width="81px"><Translate content="exchange.total" /></td>
                        <td>
                          <div className="grid-block buy-sell-row" style={{border:"1px solid #e7e7e7",width:"100%",height:30,lineHeight:"30px",overflow:"hidden",marginBottom:0,padding:"0 10px"}}>
                            <ExchangeInput id={`${type}Total`} value={total} onChange={totalChange} autoComplete="off" placeholder="0.0" style={{border:"none",height:"28px",margin:0,padding:0,fontSize:"12px"}}/>
                            <span style={{fontSize:"12px",color:"#666"}}>
                              <AssetName dataPlace="right" name={base.get("symbol")} />
                            </span>
                          </div>
                        </td>
                      </tr>
                        <tr>
                            <td colSpan="2">
                              <div style={{paddingBottom:9,paddingTop:10}}>
                                <Slider marks={marks} tipFormatter={this._sliderFormatter}
                                        defaultValue={0}
                                        disabled={sliderDisable}
                                        getTooltipPopupContainer={trigger => trigger.parentNode}
                                        onChange={this._onSliderChange.bind(this,balanceAmount)}/>
                              </div>
                            </td>
                        </tr>
                      <tr height="28px">
                        <td width="60px"><Translate content="exchange.exchange_form.total" /></td>
                        <td>
                          <div className="flex-align-middle">
                            {amount <= 0 ? 0 : (total || 0)}&nbsp;
                            <AssetName dataPlace="right" name={base.get("symbol")} />
                          </div>
                        </td>
                      </tr>
                      <tr height="40px" style={{display:"none"}}>
                        <td width="81px"><Translate content="transfer.fee" /></td>
                        <td>
                          <div className="grid-block buy-sell-row" style={{border:"1px solid #e7e7e7",width:"100%",height:30,lineHeight:"30px",overflow:"hidden",marginBottom:0,padding:"0 10px"}}>
                            <input className={!hasFeeBalance ? "no-balance" : ""} disabled type="text" id={`${type}Fee`} value={!hasFeeBalance ? counterpart.translate("transfer.errors.insufficient") : fee.getAmount({real: true})} autoComplete="off"
                                   style={{border:"none",height:"28px",margin:0,padding:0,fontSize:"12px"}}/>
                            <select
                              style={{
                                background: "none",border:"none",fontSize:"12px",color:"#666",
                                width:"auto",height:"auto",margin:0,padding:0
                              }}
                              disabled={feeAssets.length === 1}
                              value={feeAssets.indexOf(this.props.feeAsset)}
                              className={"form-control" + (feeAssets.length !== 1 ? " buysell-select" : "")}
                              onChange={this.props.onChangeFeeAsset}>
                              {options}
                            </select>
                          </div>
                        </td>
                      </tr>
                      <tr height="40px" style={{display:"none"}}>
                        <td width="81px">{isBid ? <Translate content="exchange.lowest_ask" /> : <Translate content="exchange.highest_bid" />}</td>
                        <td>
                          {currentPrice ? (
                            <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this.props.setPrice.bind(this, type, currentPriceObject.sellPrice())}>
                                                    <PriceText price={currentPrice} quote={quote} base={base} /> <AssetName name={base.get("symbol")} />/<AssetName name={quote.get("symbol")} />
                                                    </span>) : null}
                        </td>
                      </tr>
                      <tr height="52px">
                        <td colSpan={2}>
                          {/* BUY/SELL button */}
                          <div data-tip={disabledText ? disabledText : ""} data-place="right">
                            <button className={buttonClass + " small"} onClick={onSubmit.bind(this, true)} style={{width:"100%"}}>{buttonText}</button>
                          </div>
                        </td>
                      </tr>
                    </table>
                    </div>
                  {/*{marketFee}*/}

                </div>
                <SimpleDepositWithdraw
                    ref="deposit_modal"
                    action="deposit"
                    fiatModal={false}
                    account={this.props.currentAccount.get("name")}
                    sender={this.props.currentAccount.get("id")}
                    asset={this.props[isBid ? "base" : "quote"].get("id")}
                    modalId={"simple_deposit_modal" + (type === "bid" ? "" : "_ask")}
                    balances={[this.props.balance]}
                    {...backedCoin}
                />

                {/* Bridge modal */}
                <SimpleDepositBlocktradesBridge
                    ref="bridge_modal"
                    action="deposit"
                    account={this.props.currentAccount.get("name")}
                    sender={this.props.currentAccount.get("id")}
                    asset={this.props.balanceId}
                    modalId={"simple_bridge_modal" + (type === "bid" ? "" : "_ask")}
                    balances={[this.props.balance]}
                    bridges={this.props.currentBridges}
                />
            </div>
        );
    }
}

export default BindToChainState(BuySell, {keep_updating: true});
