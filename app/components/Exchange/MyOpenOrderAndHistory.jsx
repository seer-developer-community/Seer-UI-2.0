import React from "react";
import {PropTypes} from "react";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import Translate from "react-translate-component";
import market_utils from "common/market_utils";
import PriceText from "../Utility/PriceText";
import cnames from "classnames";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import { connect } from "alt-react";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import { ChainTypes as grapheneChainTypes } from "seerjs/es";
const {operations} = grapheneChainTypes;
import BlockDate from "../Utility/BlockDate";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import getLocale from "browser-locale";
import { MyOpenOrders } from "./MyOpenOrders";
import MyMarketHistory from "./MyMarketHistory";

class MyOpenOrderAndHistory extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.viewSettings.get("openOrderAndHistoryTab", "openOrder")
        };
    }

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            openOrderAndHistoryTab: tab
        });
        this.setState({
            activeTab: tab
        });
    }

    render() {
        let {isNullAccount} = this.props;
        let  {activeTab} = this.state;

        let hc = "mymarkets-header clickable";
        let historyClass = cnames(hc, {inactive: activeTab === "openOrder"});
        let myHistoryClass = cnames(hc, {inactive: activeTab === "history"});

        return (
            <div style={{background:"#fff"}}>
                <div className="exchange-bordered small-12" style={{height: 266,padding:0,margin:0}}>
                  <div className="flex-align-middle" style={{background:"#f7f7f7",height:"37px",lineHeight:"37px"}}>
                    <div className={cnames(myHistoryClass, {disabled: isNullAccount})} onClick={this._changeTab.bind(this, "openOrder")} >
                      <Translate content="exchange.my_history" style={{fontSize:"14px",fontWeight:"bold"}}/>
                    </div>
                    <div className={historyClass} onClick={this._changeTab.bind(this, "history")}>
                      <Translate content="exchange.history" style={{fontSize:"14px",fontWeight:"bold"}} />
                    </div>
                  </div>
                    
                    {
                        activeTab === "history" ? 
                            <MyMarketHistory {...this.props}/> : <MyOpenOrders  {...this.props}/>
                    }
                </div>
            </div>
        );
    }
}

MyOpenOrderAndHistory.defaultProps = {
    history: []
};

MyOpenOrderAndHistory.propTypes = {
    history: PropTypes.object.isRequired
};

export default connect(MyOpenOrderAndHistory, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
