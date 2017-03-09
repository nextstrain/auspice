import React from "react";
import { connect } from "react-redux";
import { dataFont, medGrey } from "../../globalStyles";
import computeResponsive from "../../util/computeResponsive";
import Flex from "./flex";
import Radium from "radium";
import d3 from "d3";

export const h7n9authors = "Afonso,CL, Ahmed, Akopov,A, Alex, Alvarez,D, Amedeo,P, Angel,M, Anne, Appalla,L, Bae,YC, Bahgat, Bahl,J, Banner,D, Bao,C, Bao,CJ, Bao,Y, Bastien,Nathalie, Beerens, Bera,J, Bermejo-Martin,JF, Betoulle,J-L, Bishop,B, Bo,Hong, Boon,A, Bossers, Bu, Busquets,N, C, Cai,PQ, Cai,Q, Cai,Y, Calvin,AA, Cao, Cao,G-P, Cao,W-C, Cernikova,L, Chai,Y, Chan,JFW, Chan,K-H, Chang,S-C, Chang,S-Y, Chang,Y-F, Changwen, Chen, Chen,C, Chen,E-F, Chen,G-W, Chen,GW, Chen,H, Chen,H-L, Chen,HL, Chen,Hong-lin, Chen,J, Chen,JF, Chen,L, Chen,L-J, Chen,LJ, Chen,P, Chen,QJ, Chen,R, Chen,W, Chen,Wenbing, Chen,X, Chen,Y, Chen,Yu, Cheng,PKC, Cheng,Yanhui, Cheung,CL, Choi,J-G, Choi,JG, Choi,Y-K, Chris, Claire, Cornelius, Cui,DW, Cui,Da-wei, Cui,L, Cui,LB, Das,SR, Davis, Davis,Todd, Deng, Deng,F, Derksen,DV, Dernovoy,D, Din,H, Ding,G, Ding,H, Ding,SJ, Dong,J, Dong,Jie, Dong,Libo, Dong,W, Du,X, Duan,L, Dugan,V, E, Edworthy,P, Elassal, Ely,CR, Emad, Fan, Fan,F, Fan,G, Fan-Ngai, Fang,C-F, Fang,L-Q, Fang,X, Farooqui,A, Fedorova,N, Flint,PL, Fouchier,R, Fouchier,RA, Fouchier,RAM, Frances, Frank, G, Gao,GF, Gao,HN, Gao,Rongbao, Gao,Y, Gaynor, Ge,Y, Geraldine, Gerloff, Ghedin,E, Gong,YN, Gonzalez,AS, Graaf,M, Gray,GC, Gu, Guan, Guan,D, Guan,PhD, Guan,W, Guan,Y, Guangyuan,Ma, Guo, Guo,C, Guo,J, Guo,Junfeng, Guo,W-P, Guo,X, Guo,XL, Gupta,N, H, Haibo, Halpin,R, Halpin,RA, Han,K, Hang, Harders, He, He,H, He,J, He,K, He,MD, Heutink, Ho-Sheng, Holmes,EC, Hong,L, Hong,W, Hoover,J, Hornickova,J, Hou,G, Hsiao,M-J, Hsiao,MR, Hu, Hu,K, Hu,X-L, Hu,Y, Huang,J, Huang,L, Huang,SH, Huang,SS, Huang,Weijuan, Huang,X, Huang,X-M, Huang,Y, Hung,I, IP, Ip,HS, J, Ji,H, Ji-Rong, Jianfeng, Jiang, Jiang,J, Jiang,J-F, Jiang,W, Jiao,P, Jin,Q, Jin,T, Jing, Jing-Cao, Jones, Joyce, Ju,H-B, KL, Kai-Wang, Kaixiang,Xing, Kang,H-M, Kang,HM, Katzel,D, Kawaoka,Y, Ke,C, Ke,MD, Kelvin,AA, Kelvin,DJ, Khan,A, Killian,ML, Kim,E-H, Kim,HR, Kim,K-I, Kim,KI, Kim,LM, Kim,S-W, Kim,Sm, Kim,Y-I, Kiryutin,B, Kis, Kong, Kou,Y, Krajden,Mel, Krauss,S, Kuo,S-M, Kuo,SM, Kwon,H-I, Kwon,JH, L, LEE, LUK, Lai,S-M, Lam,TTY, Lam,TY, Lan,Yu, Latorre-Margalef,N, Lau,S, Lau,S-Y, Lau,SY, Lee,E-K, Lee,H-S, Lee,I-W, Lee,K-J, Lee,KJ, Lee,OS, Lee,Y-J, Lee,YJ, Lei,YL, Leon,AJ, Leung,CYH, Leung,G, Leung,GM, Li, Li,H, Li,J, Li,K, Li,L, Li,LJ, Li,Lan-juan, Li,M, Li,R, Li,W, Li,X, Li,X-L, Li,Xiaodan, Li,Xiyan, Li,Y, Li,Y-J, Li,Yan, Liang, Liang,H, Liang,L, Liang,WF, Liao,M, Liao,Y, Lin,C, Lin,J, Lin,MD, Lin,P, Lin,X, Lin,X-D, Lin,XD, Lin,Y, Lipman,DJ, Liu, Liu, Liu,D, Liu,H, Liu,J, Liu,L, Liu,Liqi, Liu,P, Liu,S, Liu,W, Liu,X, Liu,Y, Liu,Y-C, Liu,YC, Lo,JYC, Long,L, Lu'ay, Lu,B, Lu,Jian, Lung,DC, Luo,J, Lycett,SJ, Ma,C, Ma,H, Ma,M-J, Maijuan,Ma, Mak,GC, Mao,HY, McLellan,M, Mikulcova,H, Ming,Liao, Ming-Tsan, Mohan,M, Morales-Betoulle,ME, Nagy,A, Nancy, Nanshan, Natosha, Neumann,G, Ni,H, Ni,X, Nolting,J, Oem,JK, Olsen,B, Osterhaus,A, Ou,XH, Ou,Z, Overton,L, P, Pan, Pan,H, Pan,JC, Pan,S, Paquette,SG, Park,C-K, Park,CK, Park,H-Y, Park,S-J, Pearce,JM, Pei,E, Pei,EL, Peiris,J, Peiris,JM, Peiris,JS, Peiris,JSM, Perez,DR, Pirchanova,Z, Poon,L, Poon,LL, Poon,LLM, Poon,LM, Pu,XY, Puri,V, Pybus,OG, Q, Qi,W, Qi,X, Qian,X, Qian,YH, Qiao, Qin,Y, Qinhan, Que,T-L, Que,TL, Rambaut,A, Ramey,AM, Ransier,A, Reeves,AB, Ren,X, Rene, Richt,JA, Roehrl,MA, Roehrl,MH, Rubrum,A, SM, Sanders,R, Schmutz,JA, Schobel,S, Scott,MA, Shanhui,Chen, Shen,JR, Shen,Y, Shi, Shi,C, Shi,M, Shi,Z, Shih,S-R, Shih,SR, Shrivastava,S, Shu,Y, Shu,Yuelong, Shumin,Xie, Si,Y-J, Simenauer,A, Simpson, Sin-Ming, Slemons,R, Smith,DK, Smith,GJ, Soliman,Atef, Song,B-M, Song,M-S, Song,PhD, Song,W, Spackman,E, Stallknecht,D, Stockwell,T, Su,KK, Su,W, Suarez,DL, Sun, Sun,L, Sun,P, Sun,YX, Swayne,DE, Sylvia, Tang,F, Tang,FY, Tang,H, Tang,Patrick, Tatusova,T, Teng,Z, Thovarai,V, Tian, Tian,D, Tian,J-H, Tian,JH, To,K, To,KKW, Todd, Tolf,C, Tong, Trust,KA, Tsao,K-C, Tsao,KC, Tsitrin,T, Verina, Verschuren-Pritz, Vostinakova,V, W, WAI, Waldenstrom,J, Wan,X, Wang, Wang,C, Wang,D, Wang,Dayan, Wang,FJ, Wang,H, Wang,J, Wang,K, Wang,P, Wang,S, Wang,S-Q, Wang,XG, Wang,Y, Webby,R, Webby,RJ, Webster,RG, Wei, Wei,Hejiang, Weixin,Jia, Wenbao,Qi, Wenda, Wenjun, Wentworth,DE, Wester,E, Wille,M, Wo,JE, Wong,SS, Wu, Wu,D, Wu,F, Wu,H, Wu,HB, Wu,J, Wu,N, Wu,NP, Wu,R, Wu,S, Wu,X, Wu,XX, Wu,Y, Wuchun, X, Xia,W, Xiao,H, Xiao,HX, Xiao,Y, Xie,F, Xie,J, Xie,L, Xie,X, Xin, Xin,Li, Xing,C, Xingxing,Ren, Xu,K, Xu,L, Xu,S, Xu,W-D, Xu,Y, Y, YJ, Yang, Yang, Yang,D-Q, Yang,F, Yang,J, Yang,L, Yang,Lei, Yang,PhD, Yang,S-L, Yang,SG, Yang,SL, Yang,Shi-gui, Yang,X-X, Yang,Z, Yao,H, Yao,H-W, Yao,HP, Yao,Hang-ping, Yao,T, Yao,Z, Yi,H-M, Yicun,Lin, Yigang, Yonghui, Yoon,SW, Yu,Fei, Yu,H, Yu,J, Yu,X, Yu,XF, Yu,XL, Yuan, Yuan,J, Yuan,Z, Yuan,ZG, Yuen,K-Y, Yuen,KY, Yuen,Kwok-yung, Yunwen, Z, Zeng, Zeng,T, Zeng,X, Zhan,B-D, Zhang, Zhang,H, Zhang,J-M, Zhang,L, Zhang,MD, Zhang,Q, Zhang,RS, Zhang,T, Zhang,W, Zhang,X, Zhang,Y, Zhang,Y-Z, Zhang,YZ, Zhang,Ye, Zhao,B, Zhao,BH, Zhao,D, Zhao,GQ, Zhao,K, Zhao,N, Zhao,P, Zhao,Xiang, Zhao,Y, Zhdanov,S, Zheng,K, Zheng,M, Zheng,N, Zheng,R, Zheng,SF, Zheng,Shu-fa, Zheng,Z, Zhenghong, Zhong,MD, Zhong,N, Zhou,B, Zhou,J, Zhou,J-J, Zhou,Jianfang, Zhou,L, Zhou,M, Zhou,MD, Zhou,MH, Zhou,R, Zhou,Shumei, Zhou,X, Zhou,YY, Zhu,FC, Zhu,H, Zhu,W, Zhu,Wenfei, Zhu,Y, Zhu,YX, Zhu,Z, Zhuang,Q, Ziegler,A, Zifeng, Zoltan, Zou,L, Zou,Shumei";


@connect((state) => {
  return {
    tree: state.tree,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
@Radium
class Footer extends React.Component {
  constructor(props) {
    super(props);
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    style: React.PropTypes.object.isRequired
  }
  getStyles() {
    return {
      footer: {
        textAlign: "justify",
        marginLeft: "30px",
        // marginBottom: "30px",
        // padding: "0px",
        paddingBottom: "30px",
        fontFamily: dataFont,
        fontSize: 16,
        fontWeight: 300,
        color: medGrey
      },
      citationList: {
        marginTop: "10px"
      },
      citationItem: {
        paddingLeft: "0px",
        paddingRight: "10px",
        paddingTop: "1px",
        paddingBottom: "0px"
      },
      line: {
        marginTop: "20px",
        marginBottom: "20px",
        borderBottom: "1px solid #CCC"
      },
      fineprint: {
        fontSize: 14
      }
    };
  }
  getCitations(styles) {
    // HACK FOR h7n9
    if (this.context.router.location.pathname.includes("H7N9")) {
      return (
        <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
          {h7n9authors}
        </Flex>
      );
    }
    // traverse tree.nodes
    // check if !hasChildren
    // in each node there is attr.authors and attr.url
    // construct array of unique author strings
    let authorsSet = d3.set();
    let authorsToURL = {};
    if (this.props.tree) {
      if (this.props.tree.nodes) {
        this.props.tree.nodes.forEach((node) => {
          if (node.children) { return; }
          if (node.attr.authors !== "" && node.attr.authors !== "?") {
            authorsSet.add(node.attr.authors);
            if (node.attr.url) {
              authorsToURL[node.attr.authors] = node.attr.url;
            }
          }
        });
      }
    }
    const authorsListItems = authorsSet.values().sort().map((authors, index) => {
        return (
          <div key={index} style={styles.citationItem}>
            {authorsToURL[authors] ?
              <a href={authorsToURL[authors]} target="_blank">{authors}</a> :
              authors}
          </div>
        );
      });
    return (
      <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
        {authorsListItems}
      </Flex>
    );
  }
  getUpdated(styles) {
    let updated = null;
    if (this.props.metadata) {
      if (this.props.metadata.updated) {
        updated = this.props.metadata.updated;
      }
    }
    return (
      updated ?
        <Flex style={styles.fineprint}>
          Data updated {updated}
        </Flex> :
        <div/>
    )
  }
  drawFooter(styles, width) {
    let text = "This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions. For data reuse (particularly for publication), please contact the original authors:"
    // HACK FOR h7n9
    if (this.context.router.location.pathname.includes("H7N9")) {
      text = (
        <div>
          This work is made possible by the open sharing of genetic data by research groups from all over the world via <a href="http://platform.gisaid.org/">GISAID</a>. For data reuse please contact the original authors as listed below (full information in <a href="http://data.nextstrain.org/gisaid_acknowledge_table_H7N9.xls">this spreadsheet</a>).
        </div>
      )
    }
    return (
      <div style={{width: width}}>
        <div style={styles.line}/>
        {text}
        {this.getCitations(styles)}
        <div style={styles.line}/>
        {this.getUpdated(styles)}
      </div>
    );
  }
  render() {
    const styles = this.getStyles();
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: .3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    })
    const width = responsive.width - 30; // need to subtract margin when calculating div width
    return (
      <div style={styles.footer}>
        {this.props.tree && this.props.browserDimensions ? this.drawFooter(styles, width) : "Waiting on citation data"}
      </div>
    );
  }
}

export default Footer;
