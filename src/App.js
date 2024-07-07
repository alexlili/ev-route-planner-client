import React, { useState, useEffect } from "react";

import chargerIcon from "./assets/charging-station.png";
import { ConfigProvider, Layout, theme, Modal, Image, List } from "antd";
import {
  BarsOutlined,
  EnvironmentOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { useNavigate } from "react-router-dom";
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Authenticator } from "@aws-amplify/ui-react";
import { listFavouriteChargerLists, listUserCarLists} from "./graphql/queries";
import {createUserCarList} from './graphql/mutations.js'
import { generateClient } from "aws-amplify/api";
import UserCarListCreateForm from "./ui-components/UserCarListCreateForm.jsx";
import carIcon from "./assets/car.png";
const client = generateClient();
const { Content } = Layout;
const App = () => {
  const [moreStatus, setMoreStatus] = useState(false);
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [favList, setFavList] = useState([]);
  const [userCarsList,setUserCarsList]= useState([]);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  // 定义selectedKeys，来控制菜单选中状态和切换页面
  const [selectedKeys, setSelectedKeys] = useState([]);
  // useLocation react-router自带hook，能获取到当前路由信息
  const location = useLocation();
  // 每次切换路由，获取当前最新的pathname,并赋给menu组件
  useEffect(() => {
    // location.pathname对应路由数据中的path属性
    setSelectedKeys([location.pathname]);
  }, [location]);
  async function getListFavouriteChargerLists() {
    const apiData = await client.graphql({
      query: listFavouriteChargerLists,
      variables: { userId: username },
    });
    const dataListFromAPI = apiData.data.listFavouriteChargerLists.items;
    console.log("apiData===", dataListFromAPI);
    dataListFromAPI.map(
      (item) => (item.addressInfo = JSON.parse(item.addressInfo))
    );
    setFavList(dataListFromAPI);
  }
  async function getUserCarsList() {
    const apiData = await client.graphql({
      query: listUserCarLists
    });
    const dataListFromAPI = apiData.data.listUserCarLists.items;
    console.log("apiData===", dataListFromAPI);
    setUserCarsList(dataListFromAPI);
  }
  const createUserCarListItem = async(data)=> {
    console.log(data);
    await client.graphql({
      query: createUserCarList,
      variables: { input: data },
    });
    setIsAddCarOpen(false)
    getUserCarsList()
  }
  useEffect(() => {
    if (moreStatus) {
      getListFavouriteChargerLists();
      getUserCarsList()
    }
  }, [moreStatus]);
  async function handleSignOut() {
    try {
      await signOut();
      await currentAuthenticatedUser();
      window.location.reload();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }
  async function currentAuthenticatedUser() {
    try {
      const { signInDetails } = await getCurrentUser();

      console.log(signInDetails);
      setUsername(signInDetails?.loginId || "");
    } catch (err) {
      setUsername("");
      console.log(err);
    }
  }
  useEffect(() => {
    currentAuthenticatedUser();
  }, []);
  const showLoginModal = () => {
    setIsModalOpen(true);
  };
  const handleCancelLogin = () => {
    setIsModalOpen(false);
  };
  const displayMore = () => {};
  return (
    <ConfigProvider
      theme={{
        token: {
          colorText: "#000",
          // Seed Token
          colorPrimary: "rgb(4 125 149)",
          borderRadius: 4,

          // Alias Token
          colorBgContainer: "rgb(4 125 149)",
        },
        components: {
          Button: {
            colorText: "#fff",
            fontWeight: "bold",
            defaultBg: "rgb(4 125 149)",
            defaultBorderColor: "rgb(4 125 149)",
            defaultHoverBg: "rgba(245,197,24,0.9)",
            defaultHoverBorderColor: "rgba(245,197,24,0.9)",
            defaultHoverColor: "rgb(0,0,0)",
            defaultActiveBorderColor: "rgb(4 125 149)",
            defaultActiveColor: "rgb(4 125 149)",
          },
          Input: {
            colorPrimary: "rgb(4 125 149)",
            algorithm: true, // Enable algorithm
          },
        },
      }}
    >
      <Layout style={{ position: "relative", height: "100%", width: "100%" }}>
        <div
          style={{
            background: colorBgContainer,
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontWeight: "bold",
            position: "fixed",
            right: 20,
            top: 20,
            zIndex: 100,
            borderRadius: 10,
            padding: "14px 15px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Image height={30} src={chargerIcon} style={{ paddingRight: 10 }} />
            {username ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {username}
                </div>
                <div style={{ padding: "0 15px", cursor: "pointer" }}>
                  <span onClick={handleSignOut}>Sign Out</span>
                  <BarsOutlined
                    style={{
                      marginLeft: 20,
                      color: "yellow",
                      cursor: "pointer",
                      fontSize: 20,
                    }}
                    onClick={() => setMoreStatus(!moreStatus)}
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{}}
                  onClick={() => {
                    navigate("/home");
                  }}
                >
                  EV Route Planner
                </div>
                <div
                  style={{
                    paddingLeft: 20,
                    cursor: "pointer",
                    color: "#33cc11",
                  }}
                  onClick={showLoginModal}
                >
                  Sign In
                </div>
              </div>
            )}
          </div>
          {moreStatus ? (
            <div>
              <div style={{ color: "yellow", padding: "5px 0" }}>
                Favourite Charger Stations
              </div>
              <List
                style={{ height: 190, overflowY: "auto" }}
                size="small"
                header={null}
                footer={null}
                bordered
                dataSource={favList}
                renderItem={(item) => (
                  <List.Item style={{ color: "white" }}>
                    <EnvironmentOutlined style={{ paddingRight: 5 }} />
                    {item?.addressInfo?.Title || ""}
                  </List.Item>
                )}
              />
              <div
                style={{
                  color: "yellow",
                  padding: "5px 0",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <span>My Cars</span>
                <PlusOutlined onClick={() => setIsAddCarOpen(true)} style={{cursor:'pointer'}}/>
              </div>
              <List
                style={{ height: 190, overflowY: "auto" }}
                size="small"
                header={null}
                footer={null}
                bordered
                dataSource={userCarsList}
                renderItem={(item) => (
                  <List.Item style={{ color: "white" }}>
                    <Image src={carIcon} width={20}/>
                    <span>{item?.name || ""}</span>
                    <span>{item?.portType || ""}</span>
                    <span>{item?.range || ""}KM</span>
                  </List.Item>
                )}
              />
            </div>
          ) : null}
        </div>
        <Content
          style={{
            width: "100%",
            height: "100vh",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <Modal
        title=""
        open={isModalOpen}
        footer={null}
        onCancel={handleCancelLogin}
      >
        <div style={{ paddingTop: 30 }}>
          <Authenticator>
            {({ user }) => {
              console.log("user", user);
              handleCancelLogin();
              setUsername(user?.signInDetails?.loginId || "");
              window.location.reload();
            }}
          </Authenticator>
        </div>
      </Modal>
      <Modal
        title=""
        open={isAddCarOpen}
        footer={null}
        onCancel={() => setIsAddCarOpen(false)}
      >
        <div><UserCarListCreateForm onSubmit={(data)=>{
          console.log(data)
          createUserCarListItem(data)

          
        }}/></div>
        
      </Modal>
    </ConfigProvider>
  );
};

export default App;
