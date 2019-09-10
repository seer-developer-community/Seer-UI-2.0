import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import FormattedAsset from "../Utility/FormattedAsset";
import ChainStore from "seerjs/es/chain/src/ChainStore";
import AccountStore from "../../stores/AccountStore";
import SeerActions from "../../actions/SeerActions";
var Apis =  require("seerjs-ws").Apis;

require("./myRoomList.scss");

class MyRoomItem extends React.Component {

    static propTypes = {
        room: React.PropTypes.object,
        onClose: React.PropTypes.func
    }

    constructor(props) {
        super(props);

        this.state = {
            amount:null,
            asset:null,
            precision:null
        }
    }

    componentWillMount() {
        Apis.instance().db_api().exec("get_assets",[[this.props.room.option.accept_asset]]).then(objs => {
            var ret = [];
            objs.forEach(function(item,index){
                ret.push(item);
            });
            let symbol = ret.length>0 ? ret[0].symbol: "";

            let precision = ret.length>0 ? Math.pow(10,parseInt(ret[0].precision)): 1;
            this.setState({asset:symbol,precision:precision});
        });
    }

    changeAmount(e) {
        let amount = e.target.value
        if (this.props.room.room_type>0 && amount<0){
            this.setState({amount: 0});
        }
        else {
            this.setState({amount: amount});
        }
    }

    _getTotal() {
        let { room } = this.props;

        if (room.room_type == 0 && room.running_option.lmsr_running) {
            let orgin0 = 0;
            for (var i = 0; i < room.running_option.lmsr_running.items.length; i++) {
                orgin0 = orgin0 + Math.exp(room.running_option.lmsr_running.items[i] / room.running_option.lmsr.L);
            }

            let orgin1 = 0;
            for (var j = 0; j < room.running_option.lmsr_running.items.length; j++) {
                if (j == room.selectOption) {
                    orgin1 = orgin1 + Math.exp((room.running_option.lmsr_running.items[j] / room.running_option.lmsr.L) + (parseInt(this.state.amount * this.state.precision) / room.running_option.lmsr.L));
                }
                else {
                    orgin1 = orgin1 + Math.exp(room.running_option.lmsr_running.items[j] / room.running_option.lmsr.L);
                }
            }

            return parseInt(room.running_option.lmsr.L * (Math.log(orgin1) - Math.log(orgin0)));
        }else{
            return parseInt(this.state.amount);
        }
    }

    _close() {
        if (this.props.onClose) {
            this.props.onClose(this.props.room)
        }
    }

      onSubmit() {
        let {room} = this.props;

        let obj = ChainStore.getAccount(AccountStore.getState().currentAccount);
        if (!obj) return;
        let id = obj.get("id");
        let args = {
          issuer: id,
          room: room.id,
          type: 0,
          input: [room.selectOption],
          input1: [],
          input2: [],
          amount: parseInt(this.state.amount * this.state.precision)
        };
        SeerActions.participate(args);
      }

    render() {
        let {room} = this.props;

        let option = null;

        if (room.room_type == 0) {
            option = <div className="room-option">
                <div>{room.running_option.selection_description[room.selectOption]}</div>
            </div>;
        }
        else if (room.room_type == 1) {
            let total = 0;
            for (var i = 0; i < room.running_option.pvp_running.total_participate.length; i++) {
                total = total + room.running_option.pvp_running.total_participate[i];
            }
            let rate = [];
            for (var i = 0; i < room.running_option.pvp_running.total_participate.length; i++) {
                if (room.running_option.pvp_running.total_participate[i] > 0) {
                    rate.push(total / room.running_option.pvp_running.total_participate[i])
                }
                else {
                    rate.push("--");
                }
            }

            option = <div className="room-option">
                <div>{room.running_option.selection_description[room.selectOption]}</div>
                <div className="rate"><Translate content="seer.room.current_rate"/> 1:{rate[room.selectOption]} </div>
            </div>;
        }
        else if (room.room_type == 2) {
            option = <div className="room-option">
                <div>{room.running_option.selection_description[room.selectOption]}</div>
                <div className="rate"><Translate content="seer.room.current_rate"/>
                    1:{room.running_option.advanced.awards[room.selectOption] / 10000} </div>
            </div>;
        }


        return (
            <div className="my-room-item">
                <div className="room-title">{room.description}</div>
                <div className="room-close-btn" onClick={this._close.bind(this)}><span>✕</span></div>
                {option}
                <input type="text" value={this.state.amount || ""} placeholder={counterpart.translate("seer.room.placeholder_amount")} onChange={this.changeAmount.bind(this)}/>
                <div className="room-desc">
                    <div>
                        <Translate content="seer.room.min"/>：{room.option.minimum/this.state.precision} {room.room_type === 0 ? <Translate content="seer.room.part"/> : this.state.asset}
                    </div>
                    <div>
                        <Translate content="seer.room.max"/>：{room.option.maximum/this.state.precision} {room.room_type === 0 ? <Translate content="seer.room.part"/> : this.state.asset}
                    </div>
                </div>
              { !!this.state.amount && parseInt(this.state.amount) >= (room.option.minimum/this.state.precision) && parseInt(this.state.amount) <= (room.option.maximum/this.state.precision) ?
                <div className="join-info">
                  <table className="total-table">
                    <tbody>
                    <tr>
                      <td><Translate content="seer.room.total_bets"/>：</td>
                      <td>
                        <FormattedAsset amount={this._getTotal.bind(this)() || 0} exact_amount={room.room_type !== 0} asset={room.option.accept_asset}/>
                      </td>
                    </tr>
                    {/*<tr>*/}
                      {/*<td><Translate content="transfer.fee"/>：</td>*/}
                      {/*<td>200121 SEER</td>*/}
                    {/*</tr>*/}
                    </tbody>
                  </table>
                  <button className="button large submit" onClick={this.onSubmit.bind(this)}>
                    <Translate content="seer.room.participate"/>
                  </button>
                </div>

                : null
              }
            </div>
        );
    }
}


class MyRoomList extends React.Component {

    static propTypes = {
        rooms: React.PropTypes.array,
        onClose: React.PropTypes.func
    }

    static defaultProps = {
        rooms: []
    }

    constructor(props) {
        super(props);

        this.state = {
            total_bets:null,
            total_fee:null
        }
    }

    render(){
        return(
            <div className="my-rooms-list">
                {
                    this.props.rooms.map((r,i)=>{
                        return (
                            <MyRoomItem key={r.id + "_" + r.selectOption} room={r} onClose={this.props.onClose}/>
                        );
                    })
                }
            </div>
        );
    }

}

export default MyRoomList;