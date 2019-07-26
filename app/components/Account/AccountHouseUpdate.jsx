import React from "react";
import Translate from "react-translate-component";
import SeerActions from "../../actions/SeerActions";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import AmountSelector from "../Utility/AmountSelector";
import {ChainStore} from "seerjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import counterpart from "counterpart";

class AccountHouseUpdate extends React.Component {

    static propTypes = {
        house: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        house: "props.params.house_id"
    }

    constructor(props) {
        super(props);

        let core_asset = ChainStore.getAsset("1.3.0");
        this.state = {
            description: props.house.get("description") ,
            guaranty: 0,
            script: props.house.get("script")
        };
    }

    _updateHouse() {
        let core_asset = ChainStore.getAsset("1.3.0");
        let guaranty = parseInt(this.state.guaranty) * Math.pow(10, core_asset.get("precision"));
        let args = {
            issuer: this.props.account.get("id"),
            guaranty: guaranty,
            claim_fees: 0,
            description: this.state.description,
            script: this.state.script,
            house: this.props.house.get("id")
        };
        SeerActions.updateHouse(args);
    }

    _changeGuaranty({amount, asset}) {
        this.setState({guaranty: amount});
    }

    render() {
        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
              <div className="content-block small-12" style={{paddingTop:"34px",maxWidth:"37.5em"}}>
                <Translate content="account.guaranty.title" component="h5" style={{fontWeight:"bold"}}/>
                <Translate content="account.guaranty.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

                <div className="content-block" style={{marginTop:"48px"}}>
                      <Translate component="label" content="seer.oracle.description"/>
                      <textarea onChange={e => this.setState({description: e.target.value})} style={{height:"6.69em",resize: "none"}}>
                        {this.state.description}
                      </textarea>
                </div>
                <div className="content-block">
                    <Translate component="label" content="seer.oracle.script" />
                    <input type="text" value={this.state.script} placeholder={counterpart.translate("account.guaranty.script_explain")} onChange={e => this.setState({script: e.target.value})}/>
                </div>

                <div className="content-block">
                    <div style={{display:"flex",flexDirection:"row",alignItems:"center"}}>
                        <Translate content="seer.oracle.guaranty" style={{fontSize:"14px",color:"#666666"}}/>

                        <svg className="icon" aria-hidden="true" style={{width:"18px",height:"18px",marginLeft:"24px",marginRight:"9px"}}>
                            <use xlinkHref="#icon-tishi3"></use>
                        </svg>
                        <Translate content="account.guaranty.balance_explain" style={{fontSize:"14px",color:"#FF972B"}}  />
                    </div>
                    <AmountSelector asset={"1.3.0"} assets={["1.3.0"]} amount={this.state.guaranty} onChange={this._changeGuaranty.bind(this)} />
                    <div style={{fontSize:"14px",color:"#999",width:"100%",textAlign:"right",paddingTop:"1em"}}>
                      <Translate content="account.guaranty.balance" />：
                      <FormattedAsset amount={this.props.house.get("guaranty")} asset={"1.3.0"}/>
                    </div>
                </div>

                <button onClick={this._updateHouse.bind(this)} className="button primary" style={{marginTop:"48px"}}>
                  <Translate content="account.guaranty.update"/>
                </button>
              </div>
            </div>
        );
    }
}

AccountHouseUpdate =  BindToChainState(AccountHouseUpdate);

export default AccountHouseUpdate;