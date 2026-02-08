import React, { useState, useEffect, useRef } from 'react';
import { PosterConfig, RatingType, PresetType, BadgeConfig, ApiKeys } from '../types';
import { Layout, Palette, Image as ImageIcon, ScanLine, ChevronDown, ChevronRight, Tv, Film, Settings, Globe, Check, ChevronsUpDown, Clock, Sparkles } from 'lucide-react';

interface Props {
  config: PosterConfig;
  onChange: (newConfig: PosterConfig) => void;
}

// ==========================================
// ICONS CONFIGURATION
// ==========================================
const BADGE_ICONS: Record<string, { vb: string, body: string }> = {
  imdb: {
    vb: "0 0 122.88 122.88",
    body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>`
  },
  rt_fresh: {
    vb: "0 0 80 80",
    body: `<g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><mask id="mask-rt-fresh" fill="white"><polygon points="0.000109100102 0.246970954 77.0827837 0.246970954 77.0827837 63.7145228 0.000109100102 63.7145228"></polygon></mask><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A" mask="url(#mask-rt-fresh)"></path></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"></path></g>`
  },
  rt_rotten: {
    vb: "0 0 80 80",
    body: `<g transform="translate(0, 1.23)"><g><mask id="mask-rt-rotten" fill="white"><polygon points="0 0.161950465 79.7417075 0.161950465 79.7417075 77.522807 0 77.522807"></polygon></mask><path d="M71.4638596,70.225614 C56.3459649,71.0192982 53.2568421,53.7203509 47.325614,53.8435088 C44.7982456,53.8964912 42.8063158,56.5389474 43.6810526,59.6185965 C44.1621053,61.3115789 45.4964912,63.794386 46.337193,65.3350877 C49.302807,70.7719298 44.9185965,76.9245614 39.7880702,77.4449123 C31.2621053,78.3098246 27.705614,73.3638596 27.925614,68.3007018 C28.1729825,62.6168421 32.9922807,56.8091228 28.0494737,54.3378947 C22.8694737,51.7480702 18.6585965,61.8754386 13.7017544,64.1357895 C9.2154386,66.1817544 2.9877193,64.5954386 0.773684211,59.6136842 C-0.781403509,56.1129825 -0.498596491,49.3722807 6.42526316,46.8003509 C10.7501754,45.1940351 20.3880702,48.9010526 20.8824561,44.205614 C21.4522807,38.7929825 10.7575439,38.3364912 7.53754386,37.0385965 C1.84,34.7424561 -1.52280702,29.8291228 1.11192982,24.5582456 C3.08877193,20.6045614 8.90526316,18.9957895 13.3449123,20.7277193 C18.6635088,22.8024561 19.517193,28.3189474 22.2421053,30.6129825 C24.5894737,32.5901754 27.8021053,32.8375439 29.9031579,31.4782456 C31.4526316,30.4754386 31.9684211,28.2729825 31.3838596,26.2610526 C30.6084211,23.5901754 28.5505263,21.9235088 26.542807,20.2905263 C22.9698246,17.3859649 17.925614,14.8884211 20.9768421,6.96035088 C23.4778947,0.463157895 30.8133333,0.229122807 30.8133333,0.229122807 C33.7277193,-0.0985964912 36.3375439,0.781403509 38.4642105,2.68140351 C41.3073684,5.22140351 41.8610526,8.61649123 41.3852632,12.2385965 C40.9505263,15.5449123 39.7803509,18.4407018 39.1701754,21.7164912 C38.4621053,25.5196491 40.4947368,29.3519298 44.3603509,29.5010526 C49.4449123,29.6975439 50.9694737,25.7894737 51.5915789,23.3122807 C52.5024561,19.6877193 53.6978947,16.322807 57.0617544,14.2035088 C61.8894737,11.1617544 68.5954386,11.8284211 71.7066667,17.674386 C74.1677193,22.3 73.3775439,28.6677193 69.6024561,32.1449123 C67.9087719,33.7045614 65.8722807,34.254386 63.6694737,34.2698246 C60.5105263,34.2922807 57.3529825,34.2147368 54.4207018,35.6929825 C52.4245614,36.6989474 51.5547368,38.3382456 51.5550877,40.5354386 C51.5550877,42.6768421 52.6698246,44.0754386 54.4761404,44.985614 C57.8782456,46.7003509 61.6336842,47.0508772 65.3087719,47.694386 C70.6382456,48.6277193 75.3242105,50.5049123 78.3326316,55.4505263 C78.3596491,55.4940351 78.3859649,55.5378947 78.4115789,55.5821053 C81.8666667,61.4375439 78.2533333,69.8687719 71.4638596,70.225614" fill="#0AC855" mask="url(#mask-rt-rotten)"></path></g></g>`
  },
  tmdb: {
    vb: "0 0 32 32",
    body: `<rect width="32" height="32" rx="4" fill="#0d253f"/><rect x="6" y="12" width="20" height="8" rx="4" fill="url(#tmdbGrad)"/><defs><linearGradient id="tmdbGrad" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse"><stop stop-color="#90cea1"/><stop offset="1" stop-color="#01b4e4"/></linearGradient></defs>`
  },
  meta: {
    vb: "0 0 40 40",
    body: `<path d="M36.978 19.49a17.49 17.49 0 1 1 0-.021" fill="#000"/><path d="m17.209 32.937 3.41-3.41-6.567-6.567c-.276-.276-.576-.622-.737-1.014-.369-.783-.53-2.004.369-2.903 1.106-1.106 2.58-.645 4.009.784l6.313 6.313 3.41-3.41-6.59-6.59c-.276-.276-.599-.691-.76-1.037-.438-.898-.415-2.027.392-2.834 1.129-1.129 2.603-.714 4.24.922l6.128 6.129 3.41-3.41L27.6 9.274c-3.364-3.364-6.52-3.249-8.686-1.083-.83.83-1.337 1.705-1.59 2.696a6.71 6.71 0 0 0-.092 2.81l-.046.047c-1.66-.691-3.549-.277-5 1.175-1.936 1.935-1.866 3.986-1.636 5.184l-.07.07-1.681-1.36-2.95 2.949c1.037.945 2.282 2.097 3.687 3.502l7.673 7.673Z" fill="#F2F2F2"/><path d="M19.982 0A20 20 0 1 0 40 20v-.024A20 20 0 0 0 19.982 0Zm-.091 4.274A15.665 15.665 0 0 1 35.57 19.921v.018A15.665 15.665 0 1 1 19.89 4.274Z" fill="#FFBD3F"/>`
  },
  popcorn_fresh: {
    vb: "0 0 80 80",
    body: `<g transform="translate(10.1, 0)"><g><mask id="mask-pop-fresh" fill="white"><polygon points="0.0178438662 0.124907063 59.6019307 0.124907063 59.6019307 79.9821561 0.0178438662 79.9821561"></polygon></mask><path d="M2.53115242,19.0988848 C2.76163569,23.9952416 14.8892193,27.8762825 29.8007435,27.7912268 C42.8237918,27.7168773 53.6874349,24.6411896 56.3485502,20.6004461 C55.7421561,19.9265428 54.904684,19.4643866 53.9613383,19.3391822 C53.9714498,19.220223 53.9779926,19.1003717 53.9773978,18.9787361 C53.9663941,17.0423792 52.5460223,15.4477323 50.695316,15.1503346 C50.7440892,14.8999257 50.7696654,14.6408922 50.7681784,14.3759108 C50.7559851,12.2194796 48.9977695,10.481487 46.8413383,10.4936803 C46.7925651,10.4939777 46.7449814,10.4999257 46.6965056,10.5020074 C46.8344981,10.0987361 46.9118216,9.66780669 46.9094424,9.21784387 C46.8969517,7.06141264 45.1390335,5.32342007 42.9826022,5.33561338 C42.4877323,5.33858736 42.0169517,5.43702602 41.5821561,5.60743494 C40.9653532,4.44639405 39.7811152,3.63717472 38.4002974,3.54379182 C38.1597026,1.60743494 36.5055762,0.113605948 34.506171,0.124843367 C33.247881,0.13204461 32.1350186,0.736356877 31.4263197,1.66453532 C30.7075093,0.882379182 29.6773234,0.391672862 28.5314498,0.398215613 C26.3750186,0.410408922 24.637026,2.16862454 24.6492193,4.32475836 C24.6515985,4.73665428 24.718513,5.13249071 24.8386617,5.50453532 C23.9586617,5.66780669 23.1848327,6.12520446 22.6191822,6.77144981 C22.1701115,5.09888476 20.642974,3.86973978 18.8297398,3.8798513 C17.1357621,3.88966543 15.7040892,4.97873606 15.172342,6.48981413 C13.7332342,7.07182156 12.7202974,8.48356877 12.7298141,10.1302602 C12.7318959,10.4960595 12.7878067,10.8481784 12.8838662,11.1836431 C12.398513,10.9713011 11.8634944,10.852342 11.2996283,10.8556134 C9.5994052,10.8654275 8.16327138,11.9622305 7.63598513,13.4822305 C7.13040892,13.2472862 6.56832714,13.1137546 5.973829,13.1173234 C3.81739777,13.1295167 2.07910781,14.8874349 2.09153162,17.0438662 C2.09546468,17.7549442 2.29263941,18.4187361 2.62810409,18.9909294 C2.59390335,19.0254275 2.56386617,19.063197 2.53115242,19.0988848" fill="#F9D320" mask="url(#mask-pop-fresh)"></path><path d="M50.9736803,68.1576208 C49.8275093,69.89829 47.6002974,71.7008178 45.2692937,72.9026022 L49.2541264,32.4853532 C51.7894424,31.6707807 54.2634944,30.5915242 56.085948,29.0438662 L50.9736803,68.1576208 Z M41.3037918,74.5885502 C37.4450558,75.8655762 35.201487,76.2614126 31.9895911,76.5766543 L32.4901115,35.0432714 C36.0383643,34.9415613 40.6301859,34.4606691 44.5427509,33.6255762 L41.3037918,74.5885502 Z M18.29829,74.5885502 L15.0596283,33.6255762 C18.9718959,34.4606691 23.5637175,34.9415613 27.1119703,35.0432714 L27.6124907,76.5766543 C24.4005948,76.2614126 22.1573234,75.8655762 18.29829,74.5885502 Z M8.62869888,68.1576208 L3.51613383,29.0438662 C5.33858736,30.5915242 7.81263941,31.6707807 10.3479554,32.4853532 L14.3327881,72.9026022 C12.0017844,71.7008178 9.77457249,69.89829 8.62869888,68.1576208 Z M50.687881,13.6110037 C50.7384387,13.8578439 50.7666914,14.1130112 50.7681784,14.3750186 C50.7696654,14.64 50.7440892,14.8990335 50.6950186,15.1494424 C52.5460223,15.4465428 53.9663941,17.0411896 53.9773978,18.9778439 C53.9779926,19.0991822 53.9714498,19.2193309 53.9613383,19.3379926 C54.904684,19.463197 55.7421561,19.9253532 56.3485502,20.5992565 C53.6877323,24.6402974 42.8237918,27.7159851 29.8010409,27.790632 C14.8895167,27.8759851 2.76193309,23.9952416 2.53115242,19.0985874 C2.56386617,19.063197 2.59390335,19.0251301 2.62810409,18.9909294 C2.39791822,18.5983643 2.23910781,18.1608922 2.15702602,17.6966543 C0.729219331,19.0518959 -0.13472119,20.1445353 0.0172490706,21.7356134 C0.0318215613,21.9482528 6.3339777,67.0709294 6.3339777,67.0709294 C7.06111524,74.2173978 17.4388104,79.9292193 29.8010409,80 C42.1632714,79.9292193 52.5412639,74.2173978 53.2681041,67.0709294 C53.2681041,67.0709294 59.5702602,21.9482528 59.5848327,21.7356134 C59.8866914,18.5531599 56.162974,15.6642379 50.687881,13.6110037 L50.687881,13.6110037 Z" fill="#DB382A" mask="url(#mask-pop-fresh)"></path></g><path d="M15.0596283,33.6255762 L18.29829,74.5885502 C22.1573234,75.8655762 24.4005948,76.2614126 27.6124907,76.5766543 L27.1119703,35.0432714 C23.5637175,34.9415613 18.9718959,34.4606691 15.0596283,33.6255762" fill="#FFFFFE"></path><path d="M31.9895911,76.5766543 C35.201487,76.2614126 37.4447584,75.8655762 41.3037918,74.5885502 L44.5424535,33.6255762 C40.6301859,34.4606691 36.0383643,34.9415613 32.4901115,35.0432714 L31.9895911,76.5766543" fill="#FFFFFE"></path><path d="M45.2692937,72.9026022 C47.6002974,71.7008178 49.8275093,69.89829 50.9733829,68.1576208 L56.085948,29.0438662 C54.2634944,30.5915242 51.7894424,31.6707807 49.2541264,32.4853532 L45.2692937,72.9026022" fill="#FFFFFE"></path><path d="M3.51613383,29.0438662 L8.62840149,68.1576208 C9.77457249,69.89829 12.0017844,71.7008178 14.3327881,72.9026022 L10.3479554,32.4853532 C7.81263941,31.6707807 5.33858736,30.5915242 3.51613383,29.0438662" fill="#FFFFFE"></path></g>`
  },
  popcorn_rotten: {
    vb: "0 0 80 80",
    body: `<g transform="translate(0, 12.46)"><g><path d="M45.4780328,39.6152131 C45.9506885,38.4445902 47.6259672,37.7314098 48.8288525,37.8148197 C50.114623,37.904 51.4803934,39.2556066 51.719082,40.584918 C51.7634098,40.5366557 51.8098361,40.4910164 51.8570492,40.4461639 C52.2699016,40.0516721 52.7871475,39.7899016 53.3531803,39.7177705 C53.266623,39.3342951 53.2459016,38.9238033 53.3051803,38.5028197 C53.5142295,37.0205902 54.7034754,35.9092459 56.0650492,35.9202623 C56.9437377,35.9273443 57.714623,36.376918 58.216918,37.067541 C58.2617705,37.0114098 58.3113443,36.96 58.3596066,36.907541 C58.9340328,33.9152787 59.2980984,30.5345574 59.3809836,26.9468852 C59.6655738,14.6103607 56.5356066,4.53193443 52.3902951,4.43645902 C48.2447213,4.34072131 44.653377,14.2638689 44.3687869,26.6003934 C44.3687869,26.6003934 44.1492459,31.1000656 45.4780328,39.6152131" id="Fill-1" fill="#185A30"></path><path d="M73.5446557,53.1058361 C73.7896393,52.696918 73.9265574,52.2066885 73.9171148,51.6857705 C73.9965902,50.002623 72.8411803,48.4768525 71.2335738,48.6457705 C71.28,48.4532459 71.3104262,48.2531148 71.3222295,48.0466885 C71.4184918,46.3606557 70.2557377,44.907541 68.7249836,44.8013115 C68.6914098,44.7992131 68.6583607,44.7981639 68.6250492,44.7971148 C68.7842623,44.3787541 68.8632131,43.9116066 68.8351475,43.4166557 C68.7559344,42.0139016 67.7885902,40.832 66.5300984,40.5993443 C66.075541,40.5154098 65.634623,40.5571148 65.2309508,40.696918 C64.8495738,39.757377 64.0487869,39.060459 63.074623,38.9133115 C62.9975082,37.3878033 61.8956066,36.1321967 60.4768525,36.0338361 C59.5847869,35.9719344 58.7651148,36.3816393 58.216918,37.067541 C57.714623,36.376918 56.9437377,35.9276066 56.0650492,35.9204395 C54.7034754,35.9092459 53.5142295,37.0205902 53.3051803,38.5028197 C53.2459016,38.9238033 53.266623,39.3342951 53.3531803,39.7180328 C52.7871475,39.7899016 52.2699016,40.0519344 51.8570492,40.4461639 C51.8098361,40.4910164 51.7634098,40.5366557 51.719082,40.584918 C51.4803934,39.2556066 50.114623,37.9042623 48.8288525,37.8148197 C47.6259672,37.7314098 45.928918,38.4621639 45.4780328,39.6152131 C45.6758033,41.6259672 46.9327213,47.1071475 51.4788197,52.0241311 L51.5192131,52.0270164 C51.9575082,52.4236066 52.5298361,52.6420984 53.1399344,52.5878033 C53.5181639,52.5539672 53.8664918,52.418623 54.1665574,52.2098361 L54.2397377,52.2148197 C54.6397377,52.4925902 55.1205246,52.6379016 55.6285902,52.5927869 C55.8226885,52.5754754 56.0078689,52.5287869 56.1838689,52.4621639 C56.6192787,53.3623607 57.5902951,53.9441311 58.6740984,53.8486557 C59.5134426,53.7746885 60.2268852,53.3104262 60.6462951,52.6570492 L60.7821639,52.6664918 C61.2010492,53.0817049 61.7579016,53.323541 62.3585574,53.3054426 C62.855082,54.0566557 63.767082,54.5188197 64.7735082,54.4304262 C65.1525246,54.3971148 65.5063607,54.2874754 65.8219016,54.1214426 C66.3483279,54.7690492 67.2123279,55.1540984 68.1602623,55.0706885 C69.0974426,54.9885902 69.8890492,54.4689836 70.3197377,53.7505574 C70.7428197,54.0902295 71.272918,54.2725246 71.8358033,54.2224262 C72.3819016,54.1736393 72.8671475,53.9158033 73.2317377,53.5257705 L73.2925902,53.5299672 C73.3754754,53.4098361 73.4462951,53.2868197 73.5121311,53.1627541 C73.5137049,53.1603934 73.5150164,53.1577705 73.5163279,53.1554098 C73.5252459,53.1388852 73.5362623,53.122623 73.5446557,53.1058361" fill="#F9D320"></path><path d="M42.2090492,9.21232787 L6.56209836,12.7268197 C7.62203279,10.6709508 9.21206557,8.70662295 10.7472787,7.6957377 L45.2440656,3.18662295 C43.8793443,4.79422951 42.9272131,6.9762623 42.2090492,9.21232787 Z M45.2440656,49.5517377 L10.7472787,45.042623 C9.21206557,44.032 7.62203279,42.0674098 6.56209836,40.0118033 L42.2090492,43.5262951 C42.9272131,45.7620984 43.8793443,47.9443934 45.2440656,49.5517377 Z M5.07514754,36.5143607 C3.94885246,33.1108197 3.6,31.1323279 3.32170492,28.2992787 L39.9527869,28.7409836 C40.0427541,31.8701639 40.4668852,35.9202623 41.2031475,39.3707541 L5.07514754,36.5143607 Z M5.07514754,16.224 L41.2031475,13.3676066 C40.4668852,16.8180984 40.0427541,20.8681967 39.9527869,23.9976393 L3.32170492,24.439082 C3.6,21.6062951 3.94885246,19.627541 5.07514754,16.224 Z M56.7186885,3.84865574 C54.4333115,1.18767213 52.7926557,-0.0616393443 51.3872787,0.100721311 C51.1252459,0.134032787 11.4032787,5.67213115 11.4032787,5.67213115 C5.10006557,6.31318033 0.0624262295,15.4659672 0,26.3693115 C0.0624262295,37.2723934 5.10006557,46.4251803 11.4032787,47.0664918 C11.4032787,47.0664918 51.1997377,52.6247869 51.3872787,52.6376393 C51.7196066,52.635541 52.0477377,52.5909508 52.3711475,52.5080656 C52.0563934,52.4144262 51.7660328,52.2504918 51.5192131,52.0270164 L51.4788197,52.0241311 C46.9327213,47.1074098 45.6758033,41.6259672 45.4780328,39.6152131 C45.4785574,39.6136393 45.4796066,39.6123279 45.4801311,39.6107541 C45.4796066,39.6123279 45.4785574,39.6136393 45.4780328,39.6152131 C44.1492459,31.1000656 44.3687869,26.6003934 44.3687869,26.6003934 C44.653377,14.2638689 48.2447213,4.34072131 52.3902951,4.43619672 C56.5356066,4.53193443 59.6655738,14.6103607 59.3809836,26.9468852 C59.2980984,30.5345574 58.9340328,33.9152787 58.3596066,36.907541 C58.9497705,36.2562623 59.741377,35.9819016 60.4768525,36.0338361 C60.6121967,36.043541 60.7438689,36.0663607 60.872918,36.096 C63.3904262,22.3210492 60.7512131,8.87029508 56.7186885,3.84865574 L56.7186885,3.84865574 Z" fill="#129B47"></path></g><path d="M41.2031475,13.3676066 L5.07514754,16.224 C3.94885246,19.627541 3.6,21.6062951 3.32170492,24.439082 L39.9527869,23.997377 C40.0427541,20.8681967 40.4668852,16.8180984 41.2031475,13.3676066" fill="#FFFFFE"></path><path d="M45.2440656,3.18662295 L10.7472787,7.6957377 C9.21206557,8.70662295 7.62203279,10.6709508 6.56209836,12.7268197 L42.2090492,9.21232787 C42.9272131,6.9762623 43.8793443,4.79422951 45.2440656,3.18662295" fill="#FFFFFE"></path><path d="M6.56209836,40.011541 C7.62203279,42.0674098 9.21206557,44.032 10.7472787,45.042623 L45.2440656,49.5517377 C43.8793443,47.9443934 42.9272131,45.7620984 42.2090492,43.5262951 L6.56209836,40.011541" fill="#FFFFFE"></path><g transform="translate(3.15, 28)"><path d="M36.8052459,0.675409836 L0.174163934,0.233704918 C0.452459016,3.0664918 0.801311475,5.0452459 1.92760656,8.44878689 L38.0556066,11.3051803 C37.3193443,7.85468852 36.8952131,3.80459016 36.8052459,0.675409836" fill="#FFFFFE"></path></g></g>`
  },
  letterboxd: {
    vb: "0 0 512 512",
    body: `<rect width="512" height="512" rx="104" fill="#14181c"/><circle cx="144" cy="256" r="88" fill="#ff8000"/><circle cx="368" cy="256" r="88" fill="#40bcf4"/><circle cx="256" cy="256" r="88" fill="#00e054"/><g clip-path="url(#lb_cut_l)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><g clip-path="url(#lb_cut_r)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><defs><clipPath id="lb_cut_l"><circle cx="144" cy="256" r="88"/></clipPath><clipPath id="lb_cut_r"><circle cx="368" cy="256" r="88"/></clipPath></defs>`
  },
  runtime: {
    vb: "0 0 512 512",
    body: `<path fill="white" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/><path fill="white" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/>`
  }
};

// ==========================================
// COMPONENT HELPERS
// ==========================================

const DebouncedSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (val: number) => void;
}> = ({ value, min, max, step = 1, label, unit = "", onChange }) => {
  const [localVal, setLocalVal] = useState(value);

  // Sync with external changes (e.g. reset button)
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        <span>{label}</span>
        <span>{Math.round(localVal * 100) / 100}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={localVal}
        onChange={(e) => setLocalVal(parseFloat(e.target.value))}
        onMouseUp={() => onChange(localVal)}
        onTouchEnd={() => onChange(localVal)}
        className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      />
    </div>
  );
};

const BadgeIcon: React.FC<{ type: string, className?: string }> = ({ type, className = "w-4 h-4" }) => {
  if (type === 'global') return <Globe className={className} />;
  if (type === 'age') return <div className={`${className} flex items-center justify-center border rounded border-current opacity-75`}><span className="text-[8px] font-bold leading-none">13+</span></div>;
  
  // Icon Mapping Logic
  let iconKey = type;
  if (type === 'rt') iconKey = 'rt_fresh'; // Default icon for RT selection
  if (type === 'rt_popcorn') iconKey = 'popcorn_fresh'; // Default icon for Popcorn selection
  
  const iconData = BADGE_ICONS[iconKey];
  if (iconData) return <svg viewBox={iconData.vb} className={className} dangerouslySetInnerHTML={{ __html: iconData.body }} />;
  
  return <ScanLine className={className} />;
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">{icon} <span>{title}</span></div>
        {isOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

const IconSelect: React.FC<{ value: string; options: { value: string; label: string; icon: string }[]; onChange: (value: string) => void; }> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find(o => o.value === value) || options[0];
  return (
    <div className="relative w-full" ref={containerRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-md px-3 py-2 text-xs text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/50">
        <div className="flex items-center gap-2"><BadgeIcon type={selectedOption.icon} className="w-4 h-4 text-zinc-400" /><span>{selectedOption.label}</span></div>
        <ChevronsUpDown size={12} className="text-zinc-500" />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-zinc-700/50 transition-colors ${value === opt.value ? 'bg-blue-600/10 text-blue-200' : 'text-zinc-300'}`}>
              <div className="flex items-center gap-2"><BadgeIcon type={opt.icon} className={`w-4 h-4 ${value === opt.value ? 'text-blue-400' : 'text-zinc-500'}`} /><span>{opt.label}</span></div>
              {value === opt.value && <Check size={12} className="text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// CONTROLS COMPONENT
// ==========================================

const Controls: React.FC<Props> = ({ config, onChange }) => {
  const [selectedBadge, setSelectedBadge] = useState<RatingType | 'global'>('global');
  
  // Helper to determine if we are editing global or item config
  const isGlobal = selectedBadge === 'global';
  const itemConfig = !isGlobal ? config.items[selectedBadge as RatingType] : null;

  const handleChange = (key: keyof PosterConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  // Values (Global or Item Override)
  const getCurrentValue = <K extends keyof BadgeConfig>(key: K, globalKey: keyof PosterConfig) => {
      if (isGlobal) return config[globalKey];
      return itemConfig?.[key] !== undefined ? itemConfig[key] : config[globalKey];
  };

  const updateValue = (key: keyof BadgeConfig, globalKey: keyof PosterConfig, value: any) => {
      if (isGlobal) {
          onChange({ ...config, [globalKey]: value });
      } else {
          onChange({
              ...config,
              items: { ...config.items, [selectedBadge as RatingType]: { ...itemConfig, [key]: value } }
          });
      }
  };

  // Gradient Helpers
  const getBgValue = () => isGlobal ? (config.globalBg || 'rgba(0,0,0,0.4)') : (itemConfig?.bg || config.globalBg || 'rgba(0,0,0,0.4)');
  const isGradient = (bg: string) => bg?.startsWith('grad:') || false;
  const getGradientColors = (bg: string) => {
      if (!bg || !bg.startsWith('grad:')) return ['#000000', '#000000'];
      const parts = bg.split(':');
      return [parts[1] || '#000000', parts[2] || parts[1] || '#000000'];
  };

  // Ensure color inputs always receive a hex string to avoid crashes
  const toHex = (c: any) => (typeof c === 'string' && c.startsWith('#')) ? c : '#000000';

  const handleBgTypeChange = (useGrad: boolean) => {
      const current = getBgValue();
      let newVal = '#000000';
      if (useGrad) {
          if (!current.startsWith('grad:')) newVal = `grad:${current}:${current}`;
      } else {
          if (current.startsWith('grad:')) newVal = current.split(':')[1];
      }
      updateValue('bg', 'globalBg', newVal);
  };

  const handleGradientColorChange = (idx: 0 | 1, val: string) => {
      const current = getBgValue();
      const colors = getGradientColors(current);
      colors[idx] = val;
      updateValue('bg', 'globalBg', `grad:${colors[0]}:${colors[1]}`);
  };

  const updateApiKey = (key: keyof ApiKeys, value: string) => {
    onChange({ ...config, keys: { ...config.keys, [key]: value } });
  };

  const toggleRating = (r: RatingType) => {
    const current = new Set(config.ratings);
    if (current.has(r)) current.delete(r); else current.add(r);
    // Maintain a specific sort order
    const order: RatingType[] = ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'tmdb', 'meta', 'runtime', 'age'];
    const newRatings = order.filter(x => current.has(x));
    handleChange('ratings', newRatings);
  };

  const selectClass = "w-full appearance-none bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_12px_center] bg-no-repeat pr-8";
  const styleOptions = [{ value: 'global', label: 'Global Defaults', icon: 'global' }, ...config.ratings.map(r => ({ value: r, label: `${r.replace('rt_popcorn', 'Popcorn').toUpperCase()} Override`, icon: r }))];

  const presets: {id: PresetType, label: string}[] = [
    { id: 'tl', label: 'TL' }, { id: 'tc', label: 'TC' }, { id: 'tr', label: 'TR' },
    { id: 'lc', label: 'LC' }, { id: 'cc', label: 'CC' }, { id: 'rc', label: 'RC' },
    { id: 'bl', label: 'BL' }, { id: 'bc', label: 'BC' }, { id: 'br', label: 'BR' },
  ];

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md h-full w-full flex flex-col">
      <div className="p-4 border-b border-white/5 bg-[#0f0f11] sticky top-0 z-10">
        <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-wider">Configuration</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Source & Effects" icon={<ImageIcon size={16} />}>
            <div className="flex gap-2 mb-2">
                 <button onClick={() => onChange({...config, mediaType: 'movie', tmdbId: '453395'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-colors ${config.mediaType === 'movie' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}><Film size={14}/> Movie</button>
                 <button onClick={() => onChange({...config, mediaType: 'tv', tmdbId: '93405'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-colors ${config.mediaType === 'tv' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}><Tv size={14}/> TV Show</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="col-span-2"><input type="text" value={config.tmdbId} onChange={(e) => onChange({...config, tmdbId: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-200 placeholder-zinc-600" placeholder="TMDB ID"/></div>
                <div className="col-span-1 relative"><select value={config.source} onChange={(e) => onChange({...config, source: e.target.value as any})} className={selectClass}><option value="tmdb">TMDB</option><option value="fanart">Fanart</option></select></div>
            </div>
            
            <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-300 flex items-center gap-2"><Sparkles size={12}/> Grayscale</label>
                    <input type="checkbox" checked={config.grayscale} onChange={(e) => onChange({...config, grayscale: e.target.checked})} className="rounded bg-zinc-700 border-zinc-600 text-blue-500 w-4 h-4"/>
                </div>
                <DebouncedSlider label="Background Blur" unit="px" min={0} max={20} value={config.posterBlur} onChange={(v) => onChange({...config, posterBlur: v})} />
            </div>
        </Section>

        <Section title="Active Badges" icon={<ScanLine size={16} />}>
            <div className="grid grid-cols-2 gap-2">
            {['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb'].map((r) => (
                <button key={r} onClick={() => toggleRating(r as RatingType)} className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${config.ratings.includes(r as RatingType) ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 grayscale hover:grayscale-0'}`}>
                <BadgeIcon type={r} className={`w-4 h-4 ${!config.ratings.includes(r as RatingType) && 'opacity-50'}`} /><span>{r.replace('rt_popcorn', 'Popcorn').toUpperCase()}</span>
                </button>
            ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                 <button onClick={() => toggleRating('age')} className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${config.ratings.includes('age') ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}><BadgeIcon type="age" className="w-4 h-4"/><span>Age</span></button>
                <button onClick={() => toggleRating('runtime')} className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${config.ratings.includes('runtime') ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}><Clock size={16} /><span>Runtime</span></button>
            </div>
        </Section>

        <Section title="Styling" icon={<Palette size={16} />}>
            <div className="mb-3 relative"><IconSelect value={selectedBadge} options={styleOptions} onChange={(v) => setSelectedBadge(v as any)} /></div>

            <div className={`space-y-3 p-3 rounded border ${isGlobal ? 'bg-zinc-900/30 border-transparent' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <DebouncedSlider label="Scale" unit="x" min={0.5} max={2.0} step={0.1} value={getCurrentValue('scale', 'globalScale') as number} onChange={(v) => updateValue('scale', 'globalScale', v)} />

                {/* Colors & Background */}
                <div className="mb-3">
                    <label className="text-[10px] text-zinc-500 mb-1 block">Background</label>
                    <div className="flex bg-zinc-900 rounded p-1 mb-2">
                         <button onClick={() => handleBgTypeChange(false)} className={`flex-1 text-[10px] py-1 rounded ${!isGradient(getBgValue()!) ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Solid</button>
                         <button onClick={() => handleBgTypeChange(true)} className={`flex-1 text-[10px] py-1 rounded ${isGradient(getBgValue()!) ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Gradient</button>
                    </div>
                    {isGradient(getBgValue()!) ? (
                         <div className="grid grid-cols-2 gap-2">
                             <div><input type="color" value={getGradientColors(getBgValue()!)[0]} onChange={(e) => handleGradientColorChange(0, e.target.value)} className="h-8 w-full rounded border-zinc-700"/></div>
                             <div><input type="color" value={getGradientColors(getBgValue()!)[1]} onChange={(e) => handleGradientColorChange(1, e.target.value)} className="h-8 w-full rounded border-zinc-700"/></div>
                         </div>
                    ) : (
                         <input type="color" value={toHex(getBgValue()!)} onChange={(e) => updateValue('bg', 'globalBg', e.target.value)} className="h-8 w-full rounded border-zinc-700"/>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                     <div>
                        <label className="text-[10px] text-zinc-500 mb-1 block">Text Color</label>
                        <input type="color" value={toHex(getCurrentValue('txt', 'globalTxt') as string)} onChange={(e) => updateValue('txt', 'globalTxt', e.target.value)} className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"/>
                     </div>
                     <div>
                        <label className="text-[10px] text-zinc-500 mb-1 block">Border Color</label>
                        <input type="color" value={toHex(getCurrentValue('borderC', 'globalBorderC') as string)} onChange={(e) => updateValue('borderC', 'globalBorderC', e.target.value)} className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"/>
                     </div>
                </div>

                <DebouncedSlider label="Border Width" unit="px" min={0} max={10} value={getCurrentValue('borderW', 'globalBorderW') as number} onChange={(v) => updateValue('borderW', 'globalBorderW', v)} />

                <div className="space-y-3 pt-2 border-t border-zinc-700/50">
                    <DebouncedSlider label="Blur" unit="px" min={0} max={20} value={getCurrentValue('blur', 'blur') as number} onChange={(v) => updateValue('blur', 'blur', v)} />
                    <DebouncedSlider label="Opacity" unit="" min={0} max={1} step={0.1} value={getCurrentValue('alpha', 'alpha') as number} onChange={(v) => updateValue('alpha', 'alpha', v)} />
                    <DebouncedSlider label="Radius" unit="px" min={0} max={30} value={getCurrentValue('radius', 'radius') as number} onChange={(v) => updateValue('radius', 'radius', v)} />
                </div>

                {!isGlobal && (
                    <button onClick={() => onChange({...config, items: { ...config.items, [selectedBadge as RatingType]: undefined }})} className="w-full mt-2 text-xs py-1.5 text-zinc-500 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800 transition-colors">Reset Overrides</button>
                )}
            </div>
        </Section>

        <Section title="Layout" icon={<Layout size={16} />}>
            <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded border border-zinc-700 mb-3">{presets.map(p => (<button key={p.id} onClick={() => onChange({...config, preset: p.id, items: {}})} className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded hover:bg-zinc-600 transition-colors ${config.preset === p.id ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500 bg-zinc-900/50'}`}>{p.label}</button>))}</div>
            <div className="flex gap-2"><button onClick={() => onChange({...config, layout: 'col', items: {}})} className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'col' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>Column</button><button onClick={() => onChange({...config, layout: 'row', items: {}})} className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'row' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>Row</button></div>
        </Section>

        <Section title="Advanced Settings" icon={<Settings size={16} />} defaultOpen={false}>
            <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 leading-tight">Enter your own API keys to bypass rate limits.</p>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">TMDB API Key</label><input type="password" value={config.keys?.tmdb || ''} onChange={(e) => updateApiKey('tmdb', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Fanart.tv API Key</label><input type="password" value={config.keys?.fanart || ''} onChange={(e) => updateApiKey('fanart', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">OMDB API Key</label><input type="password" value={config.keys?.omdb || ''} onChange={(e) => updateApiKey('omdb', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">MDBList API Key</label><input type="password" value={config.keys?.mdblist || ''} onChange={(e) => updateApiKey('mdblist' as any, e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
            </div>
        </Section>
      </div>
    </div>
  );
};

export default Controls;