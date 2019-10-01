import React, { Component } from 'react';
import axios from 'axios'

//Antes de começar tudo carreguei o endpoin e adicionei um header para poder trabalhar com GraphQL
const api = axios.create({
    baseURL: 'https://api.github.com/graphql',
    //O Código abaixo é a chave de acesso
    headers: {
        Authorization: `bearer 7dcd8a839a8e0ad83d2fe73b4ff49de6b5f3bd94`
    },
});

class App extends Component {

    //Aqui eu carreguei as tudo que irei usar no JSX
    state = {
        interfaceMove : false,
        user : { starredRepositories: { nodes: []} },
        userImg : '',
        loading : false,
        showStarNotif : 'star-false',
        textStarNotif: ''
    }

    //Antes do component carregar eu garanto que irei ter a imagem
    componentWillMount(){
        const userProfile = 
                `{
                    viewer{
                        avatarUrl 
                    }
                }`;
        api.post('', { query: userProfile })
        .then(result => {
            this.setState({
                ...this.state,
                userImg : result.data.data.viewer.avatarUrl
            })
        }).catch(err => console.log(err));
    }

    //Essa é a função que é disparada ao pressionar Enter
    handleKeyforInput = (e) => {
        if(e.key === "Enter"){
            this.setState({
                ...this.state,
                loading : true
            })
            const lookForUser = `{
                user(login: ${e.target.value}) {
                    name
                    login
                    bio
                    location 
                    avatarUrl  
                    websiteUrl 
                    email   
                    starredRepositories(first: 50) {
                        nodes {
                            name
                            description
                            id
                            viewerHasStarred
                            stargazers (first: 100) {
                                totalCount 
                            }  
                        }
                    }
                }
            }`;
            api.post('', { query: lookForUser })
                .then(result => {
                    const { user } = result.data.data;
                    this.setState({
                        interfaceMove : true,
                        loading : false,
                        user
                    })
                }).catch(err => {
                    this.setState({
                        interfaceMove : true,
                        loading : false,
                        user : null
                    })
                });
        }
    }

    handleClickToBack = () => {
        if(this.state.interfaceMove === true)
            this.setState({
                ...this.state,
                interfaceMove: !this.state.interfaceMove

            })
    }

    handleStarButtonClick = (e) => {
        //Só vai exister botão de Star caso essas informações já estiverem carregadas, logo eu as puxo aqui
        let starsRepo = this.state.user.starredRepositories.nodes;
        //Se a class se chamar "true" então o usuario já possui o repo em seus favoritos
        if(e.target.className === "true"){
            const unStar = `mutation {
                removeStar(input: { starrableId: "${e.target.id}" }){
                    starrable {
                        id
                    }
                }
            }`
            api.post('', { query: unStar })
                .then(result => {
                    const id = result.data.data.removeStar.starrable.id;
                    for(let i = 0; i < starsRepo.length; i++){
                        if(starsRepo[i].id === id){
                            starsRepo[i].viewerHasStarred = !starsRepo[i].viewerHasStarred;
                            starsRepo[i].stargazers.totalCount--
                        }
                    }
                    //Aqui eu carrego tudo ao State, assim o efeito do clique irá carregar
                    this.setState({
                        ...this.state,
                        textStarNotif: 'Repo starred with sucess!',
                        showStarNotif: 'star-true',
                        user : { 
                            ...this.state.user, 
                            starredRepositories: 
                                { nodes: 
                                    [...starsRepo]
                                } 
                        }
                    })
                });
        }else{
            const addStar = `mutation {
                addStar(input: { starrableId: "${e.target.id}" }){
                    starrable {
                        id
                    }
                }
            }`
            api.post('', { query: addStar })
                .then(result => {
                    const id = result.data.data.addStar.starrable.id;
                    for(let i = 0; i < starsRepo.length; i++){
                        if(starsRepo[i].id === id){
                            starsRepo[i].viewerHasStarred = !starsRepo[i].viewerHasStarred;
                            starsRepo[i].stargazers.totalCount++
                        }
                    }
                    this.setState({
                        ...this.state,
                        textStarNotif: 'Repo unstarred with sucess!',
                        showStarNotif: 'star-true',
                        user : { ...this.state.user, starredRepositories: { nodes: [...starsRepo]} }
                    })
                });
        }
    }

    handleDismiss = () =>{
        this.setState({
            ...this.state,
            showStarNotif: 'star-false',
        })
    }

    render() {
        // Essas variaveis são usadas para as animações com CSS
        let classHeader = 'header' + this.state.interfaceMove.toString()
        let classSection = 'section' + this.state.interfaceMove.toString()
        let wrapper = this.state.loading ? 'wrap-loader' : 'nowrap-loader' // -- Essa em especifico é o icone de load
        
        //Aqui eu uso destruturação para chama tudo que vou precisa no JSX
        let { 
            avatarUrl,
            starredRepositories,
            bio,
            location,
            email,
            login,
            name,
            websiteUrl,

        } = this.state.user ? this.state.user : ' '

        // A Imagem preferi pegar a parte pois achei que ficaria mais simples
        const { userImg } = this.state

        return (
            <div className="App">
                {this.state.loading ? <div className="icoWrapper"><img className="loadIco" src="./img/load.gif" /></div> : ''}
                <header className={classHeader}>
                    <div onClick={this.handleClickToBack} className="githubstars-logo "><span className="githubstars-logo-text" >Github<span className="githubstars-logo-blue">Stars</span></span></div>
                    <input onKeyDown={this.handleKeyforInput} type="text" placeholder="github username ..." /> 
                    <img src={userImg} alt="User"/>
                </header>
                {this.state.user ? 
                <section className={classSection}>   
                    <aside>
                        <div className="userprofile">
                            <img src={avatarUrl} alt="User searched"/>
                            <h3> {name} </h3>
                            <p> {login} </p>
                        </div>
                        <div className="user-details">
                            <p>{bio}</p>
                            <ul className="detailsList">
                                <li><img src="./img/users.png" /><p>@{login}</p></li>
                                <li><img src="./img/map-pin.png" /><p>{location}</p></li>
                                <li><img src="./img/mail.png" /><p>{email}</p></li>
                                <li><img src="./img/globe.png" /> <p>{websiteUrl} </p> </li>
                            </ul>
                        </div>
                    </aside>
                    <main>
                        <ul className="starsList">
                            {starredRepositories.nodes.map(item => (
                                <li key={item.id}>
                                    <div>
                                        <h3> {item.name}</h3>
                                        <p>{item.description}</p>
                                        <p><img src="./img/star.png" /> {item.stargazers.totalCount}</p>
                                    </div>
                                    <button id={item.id} onClick={this.handleStarButtonClick} className={item.viewerHasStarred.toString() }> 
                                        { item.viewerHasStarred ? 'unstar' : 'star' } 
                                    </button>
                                </li>  
                            ))}                          
                        </ul>
                    </main>
                </section>
                :
                <section className={classSection} id="notFound"> 
                    <img src="./img/notfound.png" />
                    <p className="notFound" > User not found </p>
                </section> 
                }
                <div className={'star ' + this.state.showStarNotif}>
                        <p>
                            {this.state.textStarNotif} <span onClick={this.handleDismiss}> dismiss </span> 
                        </p> 
                </div>
            </div>
        );
    }
}

export default App;
