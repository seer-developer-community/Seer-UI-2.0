import React from "react";
import {PropTypes} from "react";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import { StickyTable } from "react-sticky-table";
import Icon from "../Icon/Icon";
import "react-sticky-table/dist/react-sticky-table.css";

class OrderBookRowHorizontal extends React.Component {
    shouldComponentUpdate(np) {
        return (
            np.order.ne(this.props.order) ||
            np.position !== this.props.position ||
            np.index !== this.props.index ||
            np.currentAccount !== this.props.currentAccount
        );
    }

    render() {
        let {order, quote, base, position,priceColor} = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();

        let integerClass = isCall ? "orderHistoryCall" : isBid ? "orderHistoryBid" : "orderHistoryAsk";

        let price = utils.price_to_text(order.getPrice(), quote, base);

        let amountNum = isBid ? order.amountToReceive().getAmount({real: true}) : order.amountForSale().getAmount({real: true});
        let amount = utils.format_number(amountNum);

        let value = isBid ?
            utils.format_number(order.amountForSale().getAmount({real: true}), base.get("precision")) :
            utils.format_number(order.amountToReceive().getAmount({real: true}), base.get("precision"));
        let total = isBid ?
            utils.format_number(order.totalForSale().getAmount({real: true}), base.get("precision")) :
            utils.format_number(order.totalToReceive().getAmount({real: true}), base.get("precision"));

        return (
          <div onClick={this.props.onClick} className="order-book-row">
              <div className="content">
                <div style={{color:priceColor}} className={integerClass}>
                  {price.int}.
                  {price.dec ? price.dec :null}
                  {price.trailing ? price.trailing :null}
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
            flip: props.flipOrderBook,
            showAllBids: false,
            showAllAsks: false,
            rowCount: 20,
            autoScroll: true
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
     //   Ps.initialize(bidsContainer);
        let asksContainer = this.refs.hor_asks;
     //   Ps.initialize(asksContainer);
    }

    psUpdate() {
        let bidsContainer = this.refs.hor_bids;
        Ps.update(bidsContainer);
        let asksContainer = this.refs.hor_asks;
        Ps.update(asksContainer);
    }

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipOrderBook: !this.state.flip
        });

        this.setState({flip: !this.state.flip});
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

    render() {
        let {combinedBids, combinedAsks, highestBid, lowestAsk, quote, base, quoteSymbol, baseSymbol, latest,marketStats} = this.props;

        let {showAllAsks, showAllBids, rowCount, displaySpreadAsPercentage} = this.state;
        const noOrders = (!lowestAsk.sell_price) && (!highestBid.sell_price);
        const hasAskAndBids = !!(lowestAsk.sell_price && highestBid.sell_price)
        const spread = hasAskAndBids && (displaySpreadAsPercentage ?
          `${(100 * (lowestAsk._real_price / highestBid._real_price - 1)).toFixed(2)}%`
          : <PriceText price={lowestAsk._real_price - highestBid._real_price} base={base} quote={quote}/>);
        let bidRows = null, askRows = null;
        if(base && quote) {
            let bids = _.take(combinedBids,11);
            let asks = _.take(combinedAsks,12);

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
                        position={!this.state.flip ? "left" : "right"}
                        priceColor="#4EA382"
                        bgColor="#EBF8F4"
                        maxAmount={maxAmount}
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
                        position={!this.state.flip ? "left" : "right"}
                        priceColor="#EC5857"
                        bgColor="#FFF0EF"
                        maxAmount={maxAmount}
                        currentAccount={this.props.currentAccount}
                    />);
            });


        }

        let totalBidsLength = bidRows.length;
        let totalAsksLength = askRows.length;

        if (!showAllBids) {
            bidRows.splice(rowCount, bidRows.length);
        }

        if (!showAllAsks) {
            askRows.splice(rowCount, askRows.length);
        }
        console.log(marketStats);

        let last_price = utils.price_text(latest ? latest.full : 0, quote, base);
        const dayChange = marketStats.get("change");
        const dayChangeWithSign = (dayChange > 0) ? "+" + dayChange : dayChange;

        return (
            <div className={classnames(this.props.wrapperClass, "grid-block orderbook no-padding small-vertical align-spaced no-overflow")}>
              <div className={classnames("middle-content", this.state.flip ? "order-2" : "order-1")}>
                <div className="exchange-bordered" style={{marginLeft:0}}>
                  <div style={{background:"#f7f7f7",height:"37px",lineHeight:"37px",fontSize:"14px",color:"#333",fontWeight:"bold",paddingLeft:12}}>
                    <Translate content="exchange.bids_and_asks" />
                  </div>
                  <div className="order-book">
                      <div className="order-book-title">
                          <div><Translate content="exchange.price" /></div>
                          <div><AssetName dataPlace="top" name={baseSymbol} /></div>
                          <div><AssetName dataPlace="top" name={quoteSymbol} /></div>
                          <div><Translate content="exchange.total" />(<AssetName dataPlace="top" name={baseSymbol} />)</div>
                      </div>
                        <TransitionWrapper
                          ref="bidTransition"
                          className="orderbook clickable"
                          component="div"
                          transitionName="newrow">
                          {askRows.reverse()}
                        </TransitionWrapper>
                        <div className="order-book-current-price">
                          <div>{last_price}</div>
                          <div>➔</div>
                          <div>¥0.31</div>
                          <div>{dayChangeWithSign}%</div>
                        </div>
                        <TransitionWrapper
                          ref="askTransition"
                          className="orderbook clickable"
                          component="div"
                          transitionName="newrow">
                          {bidRows}
                        </TransitionWrapper>
                  </div>
                </div>
              </div>
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