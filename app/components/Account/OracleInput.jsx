import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SeerActions from "../../actions/SeerActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from '../Modal/BaseModal';
import RoomCard from "./RoomCard";
import FormattedAsset from "../Utility/FormattedAsset";
var Apis =  require("seerjs-ws").Apis;

class OracleInput extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount,
        room: React.PropTypes.object,
        onBack:React.PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
          room: props.room,
          input: 0,
          oracle: null,
        };
    }

    componentWillMount() {
        Apis.instance().db_api().exec("get_oracle_by_account", [this.props.account.get("id")]).then(r => {
            this.setState({oracle: r});
        });
    }

    onSubmit = () => {
        this.onModalClose();
        let args = {
            issuer: this.props.account.get("id"),
            oracle: this.state.oracle.id,
            room: this.state.room.id,
            input: [this.state.input]
        };
        SeerActions.inputOracle(args);
    }

    onModalShow() {
        ZfApi.publish('oracleInputModal', "open");
    }
    onModalClose() {
        ZfApi.publish('oracleInputModal', "close");
        ZfApi.unsubscribe("transaction_confirm_actions");
    }

    onBack(){
        if(this.props.onBack){
            this.props.onBack();
        }
    }

    render() {
        return ( <div className="grid-block vertical full-width-content">
            <Modal
                id='oracleInputModal'
                overlay={true}
                onClose={this.onModalCancel}
                noCloseBtn
            >
                <div style={{ margin: '12px' }}>
                    <Translate content="seer.room.confirm"/>
                    <span style={{textTransform: 'uppercase'}}>
                        &nbsp;
                        {
                            this.state.input === 255
                            ? <Translate content="seer.room.abandon"/>
                            : this.state.room.running_option
                                ? this.state.room.running_option.selection_description[this.state.input]
                                : null
                        }
                        &nbsp;
                    </span>
                    ?
                </div>
                <div style={{ float: 'right' }}>
                    <button className='button' type="submit" value="Submit" onClick={this.onSubmit}>
                        <Translate component="span" content="transfer.confirm" />
                    </button>
                    <button className='button' type="submit" value="Submit" onClick={this.onModalClose}>
                        <Translate component="span" content="transfer.cancel" />
                    </button>
                </div>
            </Modal>
          <div className="grid-container " style={{paddingTop: "2rem",marginLeft:0}}>
            <Translate component="h5" content="seer.room.info"/>

              <table style={{color:"#666",fontSize:14,marginTop:35}}>
                  <tbody>
                      <tr height="30px">
                            <td><Translate content="seer.room.result_owner_percent" />：{this.state.room.option.result_owner_percent/100}%</td>
                            <td width="50px">&nbsp;</td>
                            <td><Translate content="seer.room.input_duration_secs" />：{this.state.room.option.input_duration_secs / 60}</td>
                      </tr>
                      <tr height="30px">
                        <td><Translate content="seer.room.reward_per_oracle" />：<FormattedAsset amount={this.state.room.option.reward_per_oracle} asset={this.state.room.option.accept_asset}/></td>
                        <td width="50px">&nbsp;</td>
                        <td><Translate content="seer.room.end_time" />：{this.state.room.option.stop}</td>
                      </tr>
                  </tbody>
              </table>

            <Translate component="div" content="seer.oracle.input" style={{color:"#666",fontSize:18,fontWeight:"bold",margin:"55px 0 28px 0"}}/>

            <RoomCard roomObject={this.state.room} checkMode={true} showDetail={true} showGiveUpOption={true} checkedItem={this.state.input}
                      onOptionCheck={i=>this.setState({input:i})}>
              <div style={{display:"flex",justifyContent:"flex-end",padding:"86px 31px 40px 0"}}>
                    <button className="button large outline" style={{width:220,height:54}} onClick={this.onBack.bind(this)}><Translate content="transfer.back"/></button>
                {
                  this.state.oracle ?
                    <button className="button large" style={{width:220,height:54}} onClick={this.onModalShow}><Translate content="seer.oracle.input"/></button>
                    :
                    <button className="button large" style={{width:220,height:54,background: '#e5e6e4', color: '#333'}} disabled={true}><Translate content="seer.oracle.input"/></button>
                }
              </div>
            </RoomCard>
          </div>
        </div> );
    }
}

export default BindToChainState(OracleInput);
