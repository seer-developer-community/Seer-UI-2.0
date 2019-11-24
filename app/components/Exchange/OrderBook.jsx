import React from "react";
import {PropTypes} from "react";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import { StickyTable } from "react-sticky-table";
import { Select } from 'antd';
import cnames from "classnames";
import "react-sticky-table/dist/react-sticky-table.css";

class OrderBookRowHorizontal extends React.Component {

    shouldComponentUpdate(np) {
        return (
            np.order.ne(this.props.order) ||
            np.index !== this.props.index ||
            np.currentAccount !== this.props.currentAccount ||
            np.decimalPlace !== this.props.decimalPlace
        );
    }

    render() {
        let {order, quote, base,priceColor, decimalPlace} = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();

        let integerClass = isCall ? "orderHistoryCall" : isBid ? "orderHistoryBid" : "orderHistoryAsk";

        let price = utils.price_to_text(order.getPrice(), quote, base);

        let amountNum = isBid ? order.amountToReceive().getAmount({real: true}) : order.amountForSale().getAmount({real: true});
        let amount = utils.format_number(amountNum);

        let value = isBid ?
            utils.format_number(order.amountForSale().getAmount({real: true}), decimalPlace || base.get("precision")) :
            utils.format_number(order.amountToReceive().getAmount({real: true}), decimalPlace || base.get("precision"));
        let total = isBid ?
            utils.format_number(order.totalForSale().getAmount({real: true}), decimalPlace || base.get("precision")) :
            utils.format_number(order.totalToReceive().getAmount({real: true}), decimalPlace || base.get("precision"));

        return (
          <div onClick={this.props.onClick} className="order-book-row">
              <div className="content">
                <div style={{color:priceColor}} className={integerClass}>
                  {price.full.toFixed(decimalPlace)}
                  {/*{price.int}.*/}
                  {/*{price.dec ? price.dec :null}*/}
                  {/*{price.trailing ? price.trailing :null}*/}
                </div>
                <div>{value}</div>
                <div>{amount}</div>
                <div>{total}</div>
              </div>
              <div className="bg" style={{backgroundColor:this.props.bgColor,width:amountNum / this.props.maxAmount * 100 + "%"}}></div>
          </div>
        );
    }
}

class OrderBook extends React.Component {

    constructor(props) {
        super();
        this.state = {
            showAllBids: false,
            showAllAsks: false,
            onlyRowCount: 23,
            bidRowCount:11,
            askRowCount:12,
            autoScroll: true,
            currentView:'all', //ann,buy,sell
            decimalPlace:5
        };
    }

    componentWillReceiveProps(nextProps) {
        // Change of market or direction
        if (nextProps.base.get("id") !== this.props.base.get("id") || nextProps.quote.get("id") !== this.props.quote.get("id")) {

            if (this.refs.askTransition) {
                this.refs.askTransition.resetAnimation();
                if (this.refs.hor_asks) this.refs.hor_asks.scrollTop = 0;
                if (this.refs.hor_bids) this.refs.hor_bids.scrollTop = 0;
            }

            if (this.refs.bidTransition) {
                this.refs.bidTransition.resetAnimation();
            }

            if (this.refs.vert_bids) this.refs.vert_bids.scrollTop = 0;

            if (!this.props.horizontal) {
                this.setState({autoScroll: true});
            }
        }

        if (
          !utils.are_equal_shallow(nextProps.combinedAsks, this.props.combinedAsks) ||
          !utils.are_equal_shallow(nextProps.combinedBids, this.props.combinedBids)
        ) {
            this.setState({}, () => {
                this.psUpdate();
            });
        }
    }

    queryStickyTable = (query) => this.refs.vertical_sticky_table.table.querySelector(query)

    verticalScrollBar = () => this.queryStickyTable("#y-scrollbar");

    componentDidMount() {
        let bidsContainer = this.refs.hor_bids;
        Ps.initialize(bidsContainer);
        let asksContainer = this.refs.hor_asks;
        Ps.initialize(asksContainer);
    }

    psUpdate() {
        let bidsContainer = this.refs.hor_bids;
        Ps.update(bidsContainer);
        let asksContainer = this.refs.hor_asks;
        Ps.update(asksContainer);
    }

    _onToggleShowAll(type) {
        if (type === "asks") {
            this.setState({
                showAllAsks: !this.state.showAllAsks
            });

            if (this.state.showAllAsks) {
                this.refs.hor_asks.scrollTop = 0;
            }

        } else {
            this.setState({
                showAllBids: !this.state.showAllBids
            });

            if (this.state.showAllBids) {
                this.refs.hor_bids.scrollTop = 0;
            }
        }
    }

    toggleSpreadValue = () => {
        this.setState({displaySpreadAsPercentage: !this.state.displaySpreadAsPercentage});
    }

    toggleAutoScroll = () => {
        const newState = {autoScroll: !this.state.autoScroll};
        this.setState(newState);
    }

    onViewButtonClick(view){
        this.setState({
          currentView:view
        })
    }

    onDecimalPlaceChange(value){
        this.setState({
            decimalPlace:value
        });
    }

    render() {
        let {combinedBids, combinedAsks, highestBid, lowestAsk, quote, base, quoteSymbol, baseSymbol, latest,marketStats} = this.props;

        let {showAllAsks, showAllBids, onlyRowCount,bidRowCount,askRowCount, displaySpreadAsPercentage} = this.state;
        const noOrders = (!lowestAsk.sell_price) && (!highestBid.sell_price);
        const hasAskAndBids = !!(lowestAsk.sell_price && highestBid.sell_price)
        const spread = hasAskAndBids && (displaySpreadAsPercentage ?
          `${(100 * (lowestAsk._real_price / highestBid._real_price - 1)).toFixed(2)}%`
          : <PriceText price={lowestAsk._real_price - highestBid._real_price} base={base} quote={quote}/>);
        let bidRows = null, askRows = null;
        if(base && quote) {
            let bids = combinedBids;
            let asks = combinedAsks;

            if (this.state.currentView === "all") {
                bids = _.take(combinedBids,bidRowCount);
                asks = _.take(combinedAsks,askRowCount);
            }else{
                bids = _.take(combinedBids,onlyRowCount);
                asks = _.take(combinedAsks,onlyRowCount);
            }

            let maxAmountOrder = _.maxBy([...bids,...asks], o=>{
              return o.isBid() ? o.amountToReceive().getAmount({real: true}) : o.amountForSale().getAmount({real: true});
            });

            let maxAmount = maxAmountOrder.isBid() ? maxAmountOrder.amountToReceive().getAmount({real: true}) : maxAmountOrder.amountForSale().getAmount({real: true});

            bidRows = bids.map((order, index) => {
                return (
                  <OrderBookRowHorizontal
                        index={index}
                        key={order.getPrice() + (order.isCall() ? "_call" : "")}
                        order={order}
                        onClick={this.props.onClick.bind(this, order)}
                        base={base}
                        quote={quote}
                        priceColor="#4EA382"
                        bgColor="#EBF8F4"
                        maxAmount={maxAmount}
                        decimalPlace={this.state.decimalPlace}
                        currentAccount={this.props.currentAccount}
                    />
                );
            });

            askRows = asks.map((order, index) => {
                return (
                    <OrderBookRowHorizontal
                        index={index}
                        key={order.getPrice() + (order.isCall() ? "_call" : "")}
                        order={order}
                        onClick={this.props.onClick.bind(this, order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                        priceColor="#EC5857"
                        bgColor="#FFF0EF"
                        maxAmount={maxAmount}
                        decimalPlace={this.state.decimalPlace}
                        currentAccount={this.props.currentAccount}
                    />);
            });
        }

        let last_price = utils.price_text(latest ? latest.full : 0, quote, base);
        const dayChange = marketStats.get("change");
        const dayChangeWithSign = (dayChange > 0) ? "+" + dayChange : dayChange;

        return (
            <div className="order-book">
                <div className="order-book-head">
                    <Translate component="div" content="exchange.bids_and_asks" />
                    <div>
                        <button className={cnames({selected:this.state.currentView === "all"}) } onClick={this.onViewButtonClick.bind(this,"all")}>
                            <svg className="icon" aria-hidden="true">
                                <use xlinkHref="#icon-pankou-quanxianshi"></use>
                            </svg>
                        </button>
                        <button className={cnames({selected:this.state.currentView === "buy"}) }onClick={this.onViewButtonClick.bind(this,"buy")}>
                            <svg className="icon" aria-hidden="true">
                                <use xlinkHref="#icon-pankou-maipan1"></use>
                            </svg>
                        </button>
                        <button className={cnames({selected:this.state.currentView === "sell"}) }onClick={this.onViewButtonClick.bind(this,"sell")}>
                            <svg className="icon" aria-hidden="true">
                                <use xlinkHref="#icon-pankou-maipan"></use>
                            </svg>
                        </button>
                    </div>
                    <Select defaultValue={this.state.decimalPlace} onSelect={this.onDecimalPlaceChange.bind(this)}>
                        <Select.Option value="6">6位小数</Select.Option>
                        <Select.Option value="5">5位小数</Select.Option>
                        <Select.Option value="4">4位小数</Select.Option>
                        <Select.Option value="3">3位小数</Select.Option>
                        <Select.Option value="2">2位小数</Select.Option>
                        <Select.Option value="1">1位小数</Select.Option>
                    </Select>
                </div>
                <div className="order-book-title">
                    <div><Translate content="exchange.price" /></div>
                    <div><AssetName dataPlace="top" name={baseSymbol} /></div>
                    <div><AssetName dataPlace="top" name={quoteSymbol} /></div>
                    <div><Translate content="exchange.total" />(<AssetName dataPlace="top" name={baseSymbol} />)</div>
                </div>
              {
                  this.state.currentView === "all" || this.state.currentView === "sell" ?
                <div ref="hor_asks">
                  <TransitionWrapper
                    ref="bidTransition"
                    className="orderbook clickable"
                    component="div"
                    transitionName="newrow">
                    {askRows.reverse()}
                  </TransitionWrapper>
                </div> : null
              }
                <div className="order-book-current-price">
                    <div>{last_price}</div>
                    <div>➔</div>
                    <div>¥0.31</div>
                    <div>{dayChangeWithSign}%</div>
                </div>
              {
                this.state.currentView === "all" || this.state.currentView === "buy" ?
                <div ref="hor_bids">
                  <TransitionWrapper
                    ref="askTransition"
                    className="orderbook clickable"
                    component="div"
                    transitionName="newrow">
                    {bidRows}
                  </TransitionWrapper>
                </div> : null
              }
            </div>
        );
    }
}

OrderBook.defaultProps = {
    bids: [],
    asks: [],
    orders: {}
};

OrderBook.propTypes = {
    bids: PropTypes.array.isRequired,
    asks: PropTypes.array.isRequired,
    orders: PropTypes.object.isRequired
};

export default OrderBook;