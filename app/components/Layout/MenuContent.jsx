import React from "react";
import Translate from "react-translate-component";
import AccountImage from "components/Account/AccountImage";
import AccountStore from "../../stores/AccountStore";

class MenuContent extends React.Component {

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    static propTypes = {
        menus : React.PropTypes.array.isRequired
    }

    constructor(props) {
        super();

        let menuEntries = props.menus;//this._getMenuEntries(props);
        let activeSetting = -1;

        this.state = {
            activeSetting
        };
    }

    triggerModal(e, ...args) {
        this.refs.ws_modal.show(e, ...args);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.location.pathname !== this.props.location.pathname || this.state.activeSetting < 0) {
            this._onChangeMenu(nextProps.location.pathname);
        }
    }

    _redirectToEntry(entry) {
        this.context.router.push(entry.name);
    }

    _onChangeMenu(entry) {
        let index = 0;
        for (let i = 0; i < this.props.menus.length; i++) {
            if (entry.indexOf(this.props.menus[i].name) !== -1) {
                index = i;
                break;
            }
            if(this.props.menus[i].subURL && this.props.menus[i].subURL.length > 0) {
              for (let j = 0; j < this.props.menus[i].subURL.length; j++) {
                if (entry.indexOf(this.props.menus[i].subURL[j]) !== -1) {
                  index = i;
                  break;
                }
              }
            }
        }

        this.setState({
            activeSetting: index
        });
    }

    render() {
        let {linkedAccounts, account_name, searchAccounts, settings, wallet_locked, account, hiddenAssets,menus} = this.props;
        let isMyAccount = AccountStore.isMyAccount(account);

        const { activeSetting} = this.state;
        let activeEntry = menus[activeSetting] || menus[0];

        return (
        <div className="grid-block menu-content" style={{background:"#fff"}}>
            <div className="side-menu">
                <div className="user-info">
                    <AccountImage
                        size={{height: 101, width: 101}}
                        account={account_name} custom_image={null}
                    />
                    {/*<img  src="https://static.oschina.net/uploads/user/0/12_200.jpg?t=1421200584000"/>*/}
                    <div className="user-name">{account_name}</div>
                    <div className="user-uid">UID：{account.get("id")}</div>
                </div>
                 <ul>
                     {menus.map((entry, index) => {
                         if(entry === "separator"){
                             return <li key={account_name + "_" + index} className="menu-separator"></li>
                         }else{
                             return <li className={index === activeSetting ? "active" : ""} onClick={this._redirectToEntry.bind(this, entry)} key={account_name + "_" + index}>
                                 <svg className="icon" aria-hidden="true">
                                     <use xlinkHref={entry.icon}></use>
                                 </svg>
                                 <Translate content={entry.text} />
                             </li>;
                        }
                     })}
                 </ul>
            </div>
            <div className="sub-content">
              {/*{React.cloneElement(this.props.children, {...this.props})}*/}

              {React.cloneElement(
                React.Children.only(this.props.children),
                {
                  account_name,
                  linkedAccounts,
                  searchAccounts,
                  settings,
                  wallet_locked,
                  account,
                  isMyAccount,
                  hiddenAssets,
                  contained: true,
                  balances: account.get("balances", null),
                  orders: account.get("orders", null),
                  backedCoins: this.props.backedCoins,
                  bridgeCoins: this.props.bridgeCoins,
                  gatewayDown: this.props.gatewayDown,
                  viewSettings: this.props.viewSettings,
                  proxy: account.getIn(["options", "voting_account"])
                }
              )}

                {/*<activeEntry.entry {...this.props}/>*/}
            </div>
        </div>

        // <div className="grid-block main-content">
        //     <div id="sidebar" className="medium-4 grid-block settings-menu">
        //         <ul>
        //             {menus.map((entry, index) => {
        //                 return <li className={index === activeSetting ? "active" : ""} onClick={this._redirectToEntry.bind(this, entry.name)} key={entry.name}><Translate content={entry.text} /></li>;
        //             })}
        //         </ul>
        //     </div>
        //     <div id="main" className="medium-8 grid-block">
        //         {/*<activeEntry.entry {...this.props}/>*/}
        //     </div>
        // </div>


            // <div className={this.props.deprecated ? "" : "grid-block"}>
            //     <div className="grid-block main-content margin-block wrap">
            //         <div className="grid-content shrink settings-menu" style={{paddingRight: "2rem"}}>
            //             <Translate style={{paddingBottom: 10, paddingLeft: 10}} component="h3" content="header.settings" className={"panel-bg-color"}/>
            //
            //             <ul>
            //                 {menus.map((entry, index) => {
            //                     return <li className={index === activeSetting ? "active" : ""} onClick={this._redirectToEntry.bind(this, entry.name)} key={entry.name}><Translate content={entry.text} /></li>;
            //                 })}
            //             </ul>
            //         </div>
            //
            //         <div className="grid-content" style={{}}>
            //
            //         </div>
            //     </div>
            // </div>
        );
    }
}


export default MenuContent;
