import React from "react";
import Translate from "react-translate-component";
import SeerActions from "../../actions/SeerActions";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import AmountSelector from "../Utility/AmountSelector";
import {ChainStore} from "seerjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
class AccountOracleUpdate extends React.Component {

    static propTypes = {
        oracle: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        oracle: "props.params.oracle_id"
    }

    constructor(props) {
        super(props);

        this.state = {
            guaranty: 0,
            description: props.oracle.get("description"),
            script: props.oracle.get("script")
        };
    }

    _updateOracle() {
        let args = {
            issuer: this.props.account.get("id"),
            guaranty: parseInt(this.state.guaranty*100000),
            description: this.state.description,
            script: this.state.script,
            oracle: this.props.oracle.get("id")
        };
        SeerActions.updateOracle(args);
    }

    _changeGuaranty({amount, asset}) {
        this.setState({guaranty: amount});
    }

    render() {
        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
              <div className="content-block small-12" style={{paddingTop:"34px",maxWidth:"37.5em"}}>
                <Translate content="seer.oracle.my" component="h5" style={{fontWeight:"bold"}}/>
                <Translate content="seer.oracle.explain" component="p" style={{fontSize:"14px",color:"#999"}}/>

                <div className="content-block" style={{marginTop:"48px"}}>
                     <Translate component="label" content="seer.oracle.description" />
                    <textarea onChange={e => this.setState({description: e.target.value})}  style={{height:"6.69em",resize: "none"}}>{this.state.description}</textarea>
                </div>

                <div className="content-block">
                  <Translate component="label" content="house.script" />
                  <input type="text" value={this.state.script} onChange={e => this.setState({script: e.target.value})}/>
                </div>

                <div className="content-block">
                  <div style={{display:"flex",flexDirection:"row",alignItems:"center"}}>
                    <Translate content="seer.oracle.guaranty" style={{fontSize:"14px",color:"#666666"}}/>

                    <svg className="icon" aria-hidden="true" style={{width:"18px",height:"18px",marginLeft:"24px",marginRight:"9px"}}>
                      <use xlinkHref="#icon-tishi3"></use>
                    </svg>
                    <Translate content="account.guaranty.balance_explain" style={{fontSize:"14px",color:"#FF972B"}}  />
                  </div>
                  <AmountSelector asset={"1.3.0"} assets={["1.3.0"]} amount={this.state.guaranty} onChange={this._changeGuaranty.bind(this)}/>
                  <div style={{fontSize:"14px",color:"#999",width:"100%",textAlign:"right",paddingTop:"1em"}}>
                    <Translate content="account.guaranty.balance" />：
                    <FormattedAsset amount={this.props.oracle.get("guaranty")} asset={"1.3.0"}/>
                  </div>
                </div>

                <button onClick={this._updateOracle.bind(this)} className="button primary" style={{marginTop:"48px"}}>
                    <Translate content="seer.oracle.update"/>
                </button>
                </div>
            </div>
        );
    }
}

export default BindToChainState(AccountOracleUpdate);