import React from "react";
import Translate from "react-translate-component";
import { Tab, Tabs } from "../Utility/Tabs";
import classnames from "classnames";
import WalletApi from "../../api/WalletApi";
import {Apis} from "seerjs-ws";
import SeerActions from "../../actions/SeerActions";
import counterpart from "counterpart";
import AmountSelector from "../Utility/AmountSelector";

class AccountHouseCreate extends React.Component {

    constructor() {
        super();
        this.state = {
            description: "",
            guaranty: 0,
            script:""
        };
    }

    _createHouse() {
        let guaranty= parseInt(this.state.guaranty*100000)
        let args = {
            issuer: this.props.account.get("id"),
            guaranty: guaranty,
            description: this.state.description,
            script: this.state.script
        };
        SeerActions.createHouse(args);

        //let tr = WalletApi.new_transaction();

        //tr.add_type_operation("seer_house_create", args);
        //Apis.instance().db_api().exec("seer_house_create", [[args]]);
    }

    _changeDescription(e) {
        this.setState({description: e.target.value});
    }

      _changeGuaranty({amount, asset}) {
        this.setState({guaranty: amount});
      }

    render() {
        var isValid = true;
        let tabIndex;
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
                    <Translate content="account.guaranty.title" component="h5" style={{fontWeight:"bold"}}/>
                    <Translate content="account.guaranty.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

                    <div className="content-block" style={{marginTop:"48px"}}>
                        <Translate component="label" content="seer.oracle.description"/>
                        <textarea onChange={e => this.setState({description: e.target.value})} tabIndex={tabIndex++} style={{height:"6.69em",resize: "none"}}/>
                    </div>

                  <div className="content-block">
                        <Translate component="label"  content="seer.oracle.guaranty" />
                        <AmountSelector asset={"1.3.0"} assets={["1.3.0"]} amount={this.state.guaranty} tabIndex={tabIndex++} onChange={this._changeGuaranty.bind(this)} />
                    </div>

                  <div className="content-block">
                        <Translate component="label"  content="seer.oracle.script" />
                        <input type="text" onChange={e => this.setState({script: e.target.value})} tabIndex={tabIndex++} placeholder={counterpart.translate("account.guaranty.script_explain")}/>
                  </div>

                  <button onClick={this._createHouse.bind(this, false)} className="button primary" style={{marginTop:"48px"}}>
                    <Translate content="account.guaranty.submit"/>
                  </button>
                </div>
            </div>
        );
    }
}

export default AccountHouseCreate;