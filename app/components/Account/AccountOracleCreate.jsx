import React from "react";
import Translate from "react-translate-component";
import { Tab, Tabs } from "../Utility/Tabs";
import classnames from "classnames";
import WalletApi from "../../api/WalletApi";
import {Apis} from "seerjs-ws";
import SeerActions from "../../actions/SeerActions";
import AmountSelector from "../Utility/AmountSelector";
import counterpart from "counterpart";

class AccountOracleCreate extends React.Component {

    constructor() {
        super();
        this.state = {
            description: "",
            script: "",
            guaranty: 0
        };
    }

    _createOracle() {
        let args = {
            issuer: this.props.account.get("id"),
            guaranty: parseInt(this.state.guaranty*100000),
            description: this.state.description,
            script: this.state.script
        }
        SeerActions.createOracle(args);
    }

    _changeDescription(e) {
        this.setState({description: e.target.value});
    }

    _changeScript(e) {
        this.setState({script: e.target.value});
    }

      _changeGuaranty({amount, asset}) {
        this.setState({guaranty: amount});
      }

    render() {
        var isValid = true;
        const confirmButtons = (
            <div>
                <button className={classnames("button", {disabled: !isValid})}>
                    <Translate content="header.create_asset" />
                </button>
            </div>
        );

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
              <div className="content-block small-12" style={{paddingTop:"34px",maxWidth:"37.5em"}}>
                <Translate content="seer.oracle.my" component="h5" style={{fontWeight:"bold"}}/>
                <Translate content="seer.oracle.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

                <div className="content-block" style={{marginTop:"48px"}}>
                    <Translate component="label" content="seer.oracle.description"/>
                    <textarea onChange={this._changeDescription.bind(this)}  style={{height:"6.69em",resize: "none"}}/>
                </div>
                <div className="content-block">
                    <Translate component="label"  content="seer.oracle.guaranty" />
                    <AmountSelector asset={"1.3.0"} assets={["1.3.0"]} amount={this.state.guaranty} onChange={this._changeGuaranty.bind(this)} />
                </div>
                <div className="content-block">
                    <Translate component="label"  content="seer.oracle.script" />
                    <input type="text" onChange={this._changeScript.bind(this)} placeholder={counterpart.translate("account.guaranty.script_explain")}/>
                </div>

                <button onClick={this._createOracle.bind(this)} className="button primary" style={{marginTop:"48px"}}>
                  <Translate content="seer.oracle.create"/>
                </button>
                </div>
            </div>
        );
    }
}

export default AccountOracleCreate;