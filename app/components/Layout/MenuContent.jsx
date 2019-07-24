import React from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";

import _ from "lodash";

class AdminContent extends React.Component {

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    static propTypes = {
        menus : React.PropTypes.array.isRequired
    }

    constructor(props) {
        super();






        let menuEntries = props.menus;//this._getMenuEntries(props);
        let activeSetting = 0;

      //  let tabIndex = !!props.params.tab ? menuEntries.indexOf(props.params.tab) : props.viewSettings.get("activeSetting", 0);
      //  if(tabIndex >= 0)
      //      activeSetting = tabIndex;

        this.state = {
            activeSetting,
            menuEntries,
            settingEntries: {
                general: ["locale", "unit", "browser_notifications", "showSettles", "walletLockTimeout", "themes",
                "showAssetPercent", "passwordLogin", "reset"],
                access: ["apiServer", "faucet_address"]
            }
        };

        this._handleNotificationChange = this._handleNotificationChange.bind(this);
    }




    _getMenuEntries(props) {
        if (props.deprecated) {
            return [
                "wallet",
                "backup"
            ];
        }
        let menuEntries = [
            "general",
            "wallet",
            "accounts",
            "password",
            "backup",
            "restore",
            "access",
            "faucet_address",
            "reset"
        ];


        return menuEntries;
    }

    triggerModal(e, ...args) {
        this.refs.ws_modal.show(e, ...args);
    }

    _handleNotificationChange(path, value) {
        // use different change handler because checkbox doesn't work
        // normal with e.preventDefault()

        let updatedValue = _.set(this.props.settings.get("browser_notifications"), path, value);

        SettingsActions.changeSetting({
            setting: "browser_notifications",
            value: updatedValue
        });
    }


    _redirectToEntry(entry) {
        this.context.router.push(entry);
    }

    _onChangeMenu(entry) {
        let index = this.state.menuEntries.indexOf(entry);
        this.setState({
            activeSetting: index
        });

        SettingsActions.changeViewSetting({activeSetting: index});
    }

    render() {
        let {settings, defaults} = this.props;
        const {menuEntries, activeSetting, settingEntries} = this.state;
        let entries;
        let activeEntry = menuEntries[activeSetting] || menuEntries[0];

        return (

        <div className="grid-block" style={style.mainContent}>
            <div className="side-menu" style={style.sideMenu}>
                 <ul>
                     {menuEntries.map((entry, index) => {
                         return <li className={index === activeSetting ? "active" : ""} onClick={this._redirectToEntry.bind(this, entry.name)} key={entry.name}><Translate content={entry.text} /></li>;
                     })}
                 </ul>
            </div>
            <div className="sub-content" style={style.subContent}>
                <activeEntry.entry {...this.props}/>
            </div>
        </div>

        // <div className="grid-block main-content">
        //     <div id="sidebar" className="medium-4 grid-block settings-menu">
        //         <ul>
        //             {menuEntries.map((entry, index) => {
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
            //                 {menuEntries.map((entry, index) => {
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

const  style = {
    mainContent:{
        background:"red",
        display:"flex",
        flexDirection:"row"
    },
    sideMenu:{
        width:"220px",
        background:"green",
    },
    subContent:{
        flex:1,
        background:"black",
    }
}

export default AdminContent;
