import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { omnireset as omniProto } from './proto/omnireset.js';

const API_BASE_URL = 'https://ok5l57ql5gmct9-8000.proxy.runpod.net';
const ASSETS_BASE = 'https://omnireset-website.s3.us-west-004.backblazeb2.com/interactive_assets';

const scene = new THREE.Scene();
const container = document.getElementById('interactive-demo-container');
const width = container.clientWidth || 800;
const height = container.clientHeight || 550;
const camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( width, height );
container.appendChild( renderer.domElement );

new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize( w, h );
    }
}).observe( container );

// Task config: insertive and receptive GLTF filenames per task
const TASK_CONFIG = {
    drawer: { insertive: `${ASSETS_BASE}/drawer_bottom.glb`, receptive: `${ASSETS_BASE}/drawer_box.glb` },
    peg: { insertive: `${ASSETS_BASE}/peg.glb`, receptive: `${ASSETS_BASE}/peg_hole.glb` },
    leg: { insertive: `${ASSETS_BASE}/square_leg.glb`, receptive: `${ASSETS_BASE}/square_table_top.glb` },
};

const DEFAULT_INITIAL_STATE = {
    shoulder_link_x: 0, shoulder_link_y: 0, shoulder_link_z: 0.15660203993320465,
    shoulder_link_qw: 0.4044995903968811, shoulder_link_qx: -6.927424411884431e-9,
    shoulder_link_qy: -5.741209818665993e-8, shoulder_link_qz: 0.9145381450653076,
    upper_arm_link_x: 0, upper_arm_link_y: 0, upper_arm_link_z: 0.15660208463668823,
    upper_arm_link_qw: 0.6171025037765503, upper_arm_link_qx: -0.15973910689353943,
    upper_arm_link_qy: 0.6888274550437927, upper_arm_link_qz: 0.3452310562133789,
    forearm_link_x: 0.07961750030517578, forearm_link_y: -0.08755874633789062,
    forearm_link_z: 0.5647925734519958, forearm_link_qw: 0.13139617443084717,
    forearm_link_qx: 0.42565080523490906, forearm_link_qy: 0.5646427869796753,
    forearm_link_qz: 0.6947912573814392,
    wrist_1_link_x: 0.4147818088531494, wrist_1_link_y: -0.2580132484436035,
    wrist_1_link_z: 0.3910113573074341, wrist_1_link_qw: 0.6911866664886475,
    wrist_1_link_qx: -0.35461515188217163, wrist_1_link_qy: 0.6117581725120544,
    wrist_1_link_qz: 0.1492006480693817,
    wrist_2_link_x: 0.47860264778137207, wrist_2_link_y: -0.32819950580596924,
    wrist_2_link_z: 0.421685129404068, wrist_2_link_qw: 0.48391833901405334,
    wrist_2_link_qx: -0.056599944829940796, wrist_2_link_qy: 0.585632860660553,
    wrist_2_link_qz: -0.647806704044342,
    wrist_3_link_x: 0.5344462394714355, wrist_3_link_y: -0.31283271312713623,
    wrist_3_link_z: 0.34065723419189453, wrist_3_link_qw: 0.23693549633026123,
    wrist_3_link_qx: -0.7751653790473938, wrist_3_link_qy: 0.5530691146850586,
    wrist_3_link_qz: -0.19260025024414062,
    robotiq_base_link_x: 0.5418212413787842, robotiq_base_link_y: -0.31070995330810547,
    robotiq_base_link_z: 0.3268948793411255, robotiq_base_link_qw: -0.08226466178894043,
    robotiq_base_link_qx: -0.8795272707939148, robotiq_base_link_qy: -0.12983086705207825,
    robotiq_base_link_qz: 0.45034241676330566,
    left_inner_knuckle_x: 0.5618488788604736, left_inner_knuckle_y: -0.35489070415496826,
    left_inner_knuckle_z: 0.32021892070770264, left_inner_knuckle_qw: 0.1002233475446701,
    left_inner_knuckle_qx: -0.7588948011398315, left_inner_knuckle_qy: -0.4631446599960327,
    left_inner_knuckle_qz: 0.44668900966644287,
    left_inner_finger_x: 0.5366435050964355, left_inner_finger_y: -0.26653599739074707,
    left_inner_finger_z: 0.31386804580688477, left_inner_finger_qw: 0.08554805815219879,
    left_inner_finger_qx: 0.8804510235786438, left_inner_finger_qy: 0.12341061979532242,
    left_inner_finger_qz: -0.44973018765449524,
    left_outer_knuckle_x: 0.5535910129547119, left_outer_knuckle_y: -0.35796117782592773,
    left_outer_knuckle_z: 0.33256036043167114, left_outer_knuckle_qw: 0.10050337761640549,
    left_outer_knuckle_qx: -0.7586045861244202, left_outer_knuckle_qy: -0.46361973881721497,
    left_outer_knuckle_qz: 0.44662603735923767,
    left_outer_finger_x: 0.5535585880279541, left_outer_finger_y: -0.3578389883041382,
    left_outer_finger_z: 0.33254846930503845, left_outer_finger_qw: 0.10015024989843369,
    left_outer_finger_qx: -0.7589707374572754, left_outer_finger_qy: -0.46302005648612976,
    left_outer_finger_qz: 0.44670528173446655,
    right_inner_knuckle_x: 0.5328431129455566, right_inner_knuckle_y: -0.26329874992370605,
    right_inner_knuckle_z: 0.3174527883529663, right_inner_knuckle_qw: -0.25234827399253845,
    right_inner_knuckle_qx: -0.85994952917099, right_inner_knuckle_qy: 0.22563472390174866,
    right_inner_knuckle_qz: 0.38196372985839844,
    right_inner_finger_x: 0.5632779598236084, right_inner_finger_y: -0.350541353225708,
    right_inner_finger_z: 0.31636279821395874, right_inner_finger_qw: -0.07912002503871918,
    right_inner_finger_qx: -0.8785998225212097, right_inner_finger_qy: -0.13596507906913757,
    right_inner_finger_qz: 0.45090556144714355,
    right_outer_knuckle_x: 0.5240800380706787, right_outer_knuckle_y: -0.26488196849823,
    right_outer_knuckle_z: 0.32979491353034973, right_outer_knuckle_qw: -0.2525923252105713,
    right_outer_knuckle_qx: -0.8598049879074097, right_outer_knuckle_qy: 0.22618484497070312,
    right_outer_knuckle_qz: 0.38180220127105713,
    right_outer_finger_x: 0.5241298675537109, right_outer_finger_y: -0.2650172710418701,
    right_outer_finger_z: 0.32978981733322144, right_outer_finger_qw: -0.25224941968917847,
    right_outer_finger_qx: -0.8600078225135803, right_outer_finger_qy: 0.22541263699531555,
    right_outer_finger_qz: 0.3820289671421051,
    ins_x: 0.3680992126464844, ins_y: 0.3881397247314453, ins_z: 0.0015202502254396677,
    ins_qw: 0.021907875314354897, ins_qx: 0.7066609263420105, ins_qy: 0.02190152369439602,
    ins_qz: -0.7068738341331482,
    rec_x: 0.5051155090332031, rec_y: -0.07379913330078125, rec_z: 0.002180728130042553,
    rec_qw: 0.9956901669502258, rec_qx: 0, rec_qy: 0, rec_qz: 0.09274257719516754,
};

const LEG_INITIAL_STATE = {
    shoulder_link_x: 0, shoulder_link_y: 0, shoulder_link_z: 0.1630232036113739,
    shoulder_link_qw: 0.18397682905197144, shoulder_link_qx: -7.445483785062379e-9,
    shoulder_link_qy: -2.611250593531622e-8, shoulder_link_qz: 0.9829305410385132,
    upper_arm_link_x: 0, upper_arm_link_y: 0, upper_arm_link_z: 0.16302326321601868,
    upper_arm_link_qw: 0.45785266160964966, upper_arm_link_qx: -0.2319670021533966,
    upper_arm_link_qy: 0.6679754257202148, upper_arm_link_qz: 0.5388607382774353,
    forearm_link_x: 0.2010784149169922, forearm_link_y: -0.07800674438476562,
    forearm_link_z: 0.5292307138442993, forearm_link_qw: 0.17315104603767395,
    forearm_link_qx: 0.08652591705322266, forearm_link_qy: 0.7017928957939148,
    forearm_link_qz: 0.6855790615081787,
    wrist_1_link_x: 0.6121006011962891, wrist_1_link_y: -0.09447669982910156,
    wrist_1_link_z: 0.5780171155929565, wrist_1_link_qw: 0.45176756381988525,
    wrist_1_link_qx: -0.22444498538970947, wrist_1_link_qy: 0.6705403327941895,
    wrist_1_link_qz: 0.5439724922180176,
    wrist_2_link_x: 0.6911125183105469, wrist_2_link_y: -0.12512779235839844,
    wrist_2_link_z: 0.525503396987915, wrist_2_link_qw: 0.2582511603832245,
    wrist_2_link_qx: -0.5225393176078796, wrist_2_link_qy: 0.7002222537994385,
    wrist_2_link_qz: -0.4122471809387207,
    wrist_3_link_x: 0.6394329071044922, wrist_3_link_y: -0.11377143859863281,
    wrist_3_link_z: 0.44112011790275574, wrist_3_link_qw: -0.16714215278625488,
    wrist_3_link_qx: -0.6228345036506653, wrist_3_link_qy: 0.7319071888923645,
    wrist_3_link_qz: 0.22011922299861908,
    robotiq_base_link_x: 0.6298751831054688, robotiq_base_link_y: -0.11156654357910156,
    robotiq_base_link_z: 0.42878830432891846, robotiq_base_link_qw: 0.0846632570028305,
    robotiq_base_link_qx: -0.48311349749565125, robotiq_base_link_qy: 0.03460061550140381,
    robotiq_base_link_qz: 0.8707675933837891,
    left_inner_knuckle_x: 0.6160888671875, left_inner_knuckle_y: -0.15761375427246094,
    left_inner_knuckle_z: 0.4194100499153137, left_inner_knuckle_qw: 0.4181815981864929,
    left_inner_knuckle_qx: -0.45822522044181824, left_inner_knuckle_qy: -0.156925231218338,
    left_inner_knuckle_qz: 0.7684585452079773,
    left_inner_finger_x: 0.6303043365478516, left_inner_finger_y: -0.06659317016601562,
    left_inner_finger_z: 0.41742727160453796, left_inner_finger_qw: -0.07815562188625336,
    left_inner_finger_qx: 0.48284149169921875, left_inner_finger_qy: -0.03820887207984924,
    left_inner_finger_qz: -0.8713757991790771,
    left_outer_knuckle_x: 0.623809814453125, left_outer_knuckle_y: -0.1600933074951172,
    left_outer_knuckle_z: 0.43222832679748535, left_outer_knuckle_qw: 0.4186358153820038,
    left_outer_knuckle_qx: -0.45813238620758057, left_outer_knuckle_qy: -0.1571958065032959,
    left_outer_knuckle_qz: 0.7682110071182251,
    left_outer_finger_x: 0.6238250732421875, left_outer_finger_y: -0.15997886657714844,
    left_outer_finger_z: 0.432222843170166, left_outer_finger_qw: 0.41808024048805237,
    left_outer_finger_qx: -0.4582459330558777, left_outer_finger_qy: -0.15686462819576263,
    left_outer_finger_qz: 0.7685134410858154,
    right_inner_knuckle_x: 0.6334133148193359, right_inner_knuckle_y: -0.06308746337890625,
    right_inner_knuckle_z: 0.42138251662254333, right_inner_knuckle_qw: -0.2637469470500946,
    right_inner_knuckle_qx: -0.43080633878707886, right_inner_knuckle_qy: 0.2213631570339203,
    right_inner_knuckle_qz: 0.8341713547706604,
    right_inner_finger_x: 0.6143817901611328, right_inner_finger_y: -0.15334320068359375,
    right_inner_finger_z: 0.4155827760696411, right_inner_finger_qw: 0.09080301225185394,
    right_inner_finger_qx: -0.4833454489707947, right_inner_finger_qy: 0.031192269176244736,
    right_inner_finger_qz: 0.8701487183570862,
    right_outer_knuckle_x: 0.6414451599121094, right_outer_knuckle_y: -0.06403350830078125,
    right_outer_knuckle_z: 0.43427830934524536, right_outer_knuckle_qw: -0.26428890228271484,
    right_outer_knuckle_qx: -0.4306623339653015, right_outer_knuckle_qy: 0.22164328396320343,
    right_outer_knuckle_qz: 0.8339996933937073,
    right_outer_finger_x: 0.6414146423339844, right_outer_finger_y: -0.06417465209960938,
    right_outer_finger_z: 0.4342656433582306, right_outer_finger_qw: -0.2635325789451599,
    right_outer_finger_qx: -0.4308631420135498, right_outer_finger_qy: 0.2212526500225067,
    right_outer_finger_qz: 0.83423912525177,
    ins_x: 0.5175437927246094, ins_y: 0.07915878295898438, ins_z: 0.0015407934552058578,
    ins_qw: 0.4864163398742676, ins_qx: 0.48606425523757935, ins_qy: 0.513556182384491,
    ins_qz: 0.513225793838501,
    rec_x: 0.4870491027832031, rec_y: -0.06987762451171875, rec_z: 0.003147350624203682,
    rec_qw: 0.9993473291397095, rec_qx: -5.960473004051892e-8, rec_qy: 4.470348358154297e-8,
    rec_qz: -0.0361253023147583,
};

const DRAWER_INITIAL_STATE = {
    shoulder_link_x: 0, shoulder_link_y: 0, shoulder_link_z: 0.16829587519168854,
    shoulder_link_qw: 0.03612533211708069, shoulder_link_qx: -7.569837201515384e-9,
    shoulder_link_qy: -5.127406055294159e-9, shoulder_link_qz: 0.9993472099304199,
    upper_arm_link_x: 0, upper_arm_link_y: 0, upper_arm_link_z: 0.16829591989517212,
    upper_arm_link_qw: 0.43616682291030884, upper_arm_link_qx: -0.39484289288520813,
    upper_arm_link_qy: 0.5865995287895203, upper_arm_link_qz: 0.5565594434738159,
    forearm_link_x: 0.13077926635742188, forearm_link_y: -0.009466171264648438,
    forearm_link_z: 0.5725634694099426, forearm_link_qw: -0.10643202811479568,
    forearm_link_qx: 0.1566282957792282, forearm_link_qy: 0.6895416378974915,
    forearm_link_qz: 0.6990507245063782,
    wrist_1_link_x: 0.5044746398925781, wrist_1_link_y: 0.09712982177734375,
    wrist_1_link_z: 0.42911189794540405, wrist_1_link_qw: 0.48726239800453186,
    wrist_1_link_qx: -0.44899213314056396, wrist_1_link_qy: 0.5462656021118164,
    wrist_1_link_qz: 0.5124208927154541,
    wrist_2_link_x: 0.6031684875488281, wrist_2_link_y: 0.08998489379882812,
    wrist_2_link_z: 0.41692036390304565, wrist_2_link_qw: 0.46117252111434937,
    wrist_2_link_qx: -0.4987174868583679, wrist_2_link_qy: 0.5589470863342285,
    wrist_2_link_qz: -0.47558265924453735,
    wrist_3_link_x: 0.5913295745849609, wrist_3_link_y: 0.0949859619140625,
    wrist_3_link_z: 0.3181529939174652, wrist_3_link_qw: -0.0349673293530941,
    wrist_3_link_qx: -0.563198447227478, wrist_3_link_qy: 0.8237886428833008,
    wrist_3_link_qz: 0.05437750369310379,
    robotiq_base_link_x: 0.5879230499267578, robotiq_base_link_y: 0.096588134765625,
    robotiq_base_link_z: 0.30285173654556274, robotiq_base_link_qw: 0.14487943053245544,
    robotiq_base_link_qx: -0.6477466225624084, robotiq_base_link_qy: 0.12614034116268158,
    robotiq_base_link_qz: 0.7372400164604187,
    left_inner_knuckle_x: 0.5686683654785156, left_inner_knuckle_y: 0.052654266357421875,
    left_inner_knuckle_z: 0.2930082082748413, left_inner_knuckle_qw: 0.421407550573349,
    left_inner_knuckle_qx: -0.6455444693565369, left_inner_knuckle_qy: -0.13696442544460297,
    left_inner_knuckle_qz: 0.6220359206199646,
    left_inner_finger_x: 0.6027927398681641, left_inner_finger_y: 0.13808059692382812,
    left_inner_finger_z: 0.28853729367256165, left_inner_finger_qw: -0.13949716091156006,
    left_inner_finger_qx: 0.6468091607093811, left_inner_finger_qy: -0.13086245954036713,
    left_inner_finger_qz: -0.7382773160934448,
    left_outer_knuckle_x: 0.5701770782470703, left_outer_knuckle_y: 0.05117988586425781,
    left_outer_knuckle_z: 0.3080245852470398, left_outer_knuckle_qw: 0.42180120944976807,
    left_outer_knuckle_qx: -0.6454578042030334, left_outer_knuckle_qy: -0.13737259805202484,
    left_outer_knuckle_qz: 0.6217690110206604,
    left_outer_finger_x: 0.5702228546142578, left_outer_finger_y: 0.05129814147949219,
    left_outer_finger_z: 0.308014452457428, left_outer_finger_qw: 0.4213031530380249,
    left_outer_finger_qx: -0.6455675959587097, left_outer_finger_qy: -0.1368558257818222,
    left_outer_finger_qz: 0.6221064925193787,
    right_inner_knuckle_x: 0.6048927307128906, right_inner_knuckle_y: 0.14168739318847656,
    right_inner_knuckle_z: 0.2930486798286438, right_inner_knuckle_qw: -0.15599969029426575,
    right_inner_knuckle_qx: -0.5463135838508606, right_inner_knuckle_qy: 0.3701736629009247,
    right_inner_knuckle_qz: 0.7349674105644226,
    right_inner_finger_x: 0.5695381164550781, right_inner_finger_y: 0.0563812255859375,
    right_inner_finger_z: 0.2884206771850586, right_inner_finger_qw: 0.1501750349998474,
    right_inner_finger_qx: -0.6486365795135498, right_inner_finger_qy: 0.12148115783929825,
    right_inner_finger_qz: 0.7361795902252197,
    right_outer_knuckle_x: 0.6070003509521484, right_outer_knuckle_y: 0.1416606903076172,
    right_outer_knuckle_z: 0.30812638998031616, right_outer_knuckle_qw: -0.15644817054271698,
    right_outer_knuckle_qx: -0.5460874438285828, right_outer_knuckle_qy: 0.3705071210861206,
    right_outer_knuckle_qz: 0.7348719835281372,
    right_outer_finger_x: 0.6069488525390625, right_outer_finger_y: 0.14154052734375,
    right_outer_finger_z: 0.3081161677837372, right_outer_finger_qw: -0.15584821999073029,
    right_outer_finger_qx: -0.5463896989822388, right_outer_finger_qy: 0.3700612187385559,
    right_outer_finger_qz: 0.7349995970726013,
    ins_x: 0.41387939453125, ins_y: 0.5084991455078125, ins_z: 0.02967306412756443,
    ins_qw: -0.376878023147583, ins_qx: -0.37677597999572754, ins_qy: 0.59824538230896,
    ins_qz: 0.5984190106391907,
    rec_x: 0.4043083190917969, rec_y: 0.014713287353515625, rec_z: 0.045891664922237396,
    rec_qw: 0.9991099238395691, rec_qx: 1.0931484606402364e-9, rec_qy: 1.1096655150311108e-8,
    rec_qz: 0.04218423366546631,
};

const TASK_INITIAL_STATES = { peg: DEFAULT_INITIAL_STATE, leg: LEG_INITIAL_STATE, drawer: DRAWER_INITIAL_STATE };

// Kick off all asset downloads in parallel; await them as dependencies are needed.
const loader = new GLTFLoader();
const hdrLoader = new HDRLoader();
const envGltfPromise = loader.loadAsync(`${ASSETS_BASE}/env_warehouse.gltf`);
const hdrPromise = hdrLoader.loadAsync(`${ASSETS_BASE}/sky.hdr`);
// Pre-start default task object downloads so they overlap with the env scene load
const defaultTaskCfg = TASK_CONFIG['drawer'];
const drawerInsPromise = loader.loadAsync(defaultTaskCfg.insertive);
const drawerRecPromise = loader.loadAsync(defaultTaskCfg.receptive);

const envGltf = await envGltfPromise;
const sceneRoot = envGltf.scene;
scene.add(sceneRoot);

const lightScale = 0.00001; // try 0.1, 0.01, or 0.001 depending on brightness

envGltf.scene.traverse((obj) => {
    if (obj.isLight) {
      obj.intensity *= lightScale;
    }
  });
// Ensure /World/envs/env_0 exists and attach InsertiveObject and ReceptiveObject there
function getOrCreateChild(parent, name) {
    let c = parent.getObjectByName(name);
    if (c) return c;
    c = new THREE.Group();
    c.name = name;
    parent.add(c);
    return c;
}
// Z-up (USD/Isaac) to Y-up (Three.js) for loaded content (receptive needs opposite rotation)
const quatZUpToYUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
const quatZUpToYUpReceptive = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

const env0 = getOrCreateChild(getOrCreateChild(getOrCreateChild(sceneRoot, 'World'), 'envs'), 'env_0');
const insertiveContainer = new THREE.Group();
insertiveContainer.name = 'InsertiveObject';
env0.add(insertiveContainer);
const receptiveContainer = new THREE.Group();
receptiveContainer.name = 'ReceptiveObject';
env0.add(receptiveContainer);

// Cache loaded GLTFs by filename so we can switch tasks without re-fetching
const taskGltfCache = {
    [defaultTaskCfg.insertive]: drawerInsPromise,
    [defaultTaskCfg.receptive]: drawerRecPromise,
};

async function loadTaskObjects(taskId) {
    const cfg = TASK_CONFIG[taskId];
    if (!cfg) return;
    // Clear current objects
    while (insertiveContainer.children.length) insertiveContainer.remove(insertiveContainer.children[0]);
    while (receptiveContainer.children.length) receptiveContainer.remove(receptiveContainer.children[0]);
    // Load or use cached
    if (!taskGltfCache[cfg.insertive]) taskGltfCache[cfg.insertive] = loader.loadAsync(cfg.insertive);
    if (!taskGltfCache[cfg.receptive]) taskGltfCache[cfg.receptive] = loader.loadAsync(cfg.receptive);
    const [insertiveGltf, receptiveGltf] = await Promise.all([taskGltfCache[cfg.insertive], taskGltfCache[cfg.receptive]]);
    insertiveGltf.scene.quaternion.copy(quatZUpToYUpReceptive);
    insertiveContainer.add(insertiveGltf.scene.clone());
    receptiveGltf.scene.quaternion.copy(quatZUpToYUpReceptive);
    receptiveContainer.add(receptiveGltf.scene.clone());
}

// Initial load: use active tab (default drawer)
const taskTabBar = document.querySelector('.demo-tab-bar');
function getActiveTask() {
    const active = taskTabBar?.querySelector('.demo-tab.active');
    return active?.dataset.task || 'drawer';
}
taskTabBar?.querySelectorAll('.demo-tab').forEach((tab) => {
    tab.addEventListener('click', async () => {
        taskTabBar.querySelectorAll('.demo-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const taskId = tab.dataset.task;
        if (playWebSocket) {
            await sendPbStop(playWebSocket);
            playWebSocket.close();
            playWebSocket = null;
        }
        env.stop();
        insertiveContainer.visible = false;
        receptiveContainer.visible = false;
        loadTaskObjects(taskId).then(() => {
            if (tutorialStep > 0) playTrajectory();
            else { insertiveContainer.visible = true; receptiveContainer.visible = true; }
        });
    });
});
await loadTaskObjects(getActiveTask());

const envMap = await hdrPromise;
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = envMap;
scene.background = envMap;
scene.backgroundRotation.y = -Math.PI / 2;

const demoLoading = document.getElementById('demoLoading');
const demoReady = document.getElementById('demoReady');
if (demoLoading) demoLoading.style.display = 'none';
if (demoReady) demoReady.classList.remove('demo-ready--hidden');

/**
 * Camera and orbit controls: scroll to zoom, left-drag to orbit around origin.
 * Shared initial pose for peg / leg / drawer.
 */
camera.position.set(1.009, 0.278, -0.559);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.minDistance = 0.3;
controls.maxDistance = 15;
controls.update();

/**
 * Construct the arm hierarchy
 */
class Asset {
    constructor(state_keys) {
        this.state_keys = state_keys;
        this.state = null;
        this.current_setpoint = null;
        this.last_setpoint = null;
    }

    reset(initial_state_row) {
        this.state = this.parseTrajectoryRowForSetpoint(initial_state_row);
        this.current_setpoint = this.state;
        this.last_setpoint = this.state;
    }

    update(dt) {
        if (this.state == null) return;
        if (this.current_setpoint == null || this.last_setpoint == null) return;

        // Smoothly interpolate state towards current_setpoint
        for (let i = 0; i < this.state.length; i++) {
            this.state[i] = this.state[i] + (this.current_setpoint[i] - this.last_setpoint[i]) * dt;
        }
    }

    commandNewSetpoint(new_setpoint) {
        if (this.state == null) return;
        const parsed = this.parseTrajectoryRowForSetpoint(new_setpoint);
        if (parsed == null) return;
        this.state = parsed.slice();
        this.current_setpoint = this.state;
        this.last_setpoint = this.state;
    }

    parseTrajectoryRowForSetpoint(row) {
        if (!row || typeof row !== 'object') return null;
        const setpoint = [];
        for (let i = 0; i < this.state_keys.length; i++) {
            const k = this.state_keys[i];
            const raw = row[k];
            const v = typeof raw === 'number' ? raw : parseFloat(raw);
            setpoint.push(Number.isFinite(v) ? v : 0);
        }
        return setpoint;
    }
}

function isFiniteNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
}

// Same order as sim_worker ARM_LINK_NAMES; GLTF object names match (e.g. shoulder_link).
const ARM_LINK_NAMES = [
    'shoulder_link', 'upper_arm_link', 'forearm_link', 'wrist_1_link', 'wrist_2_link', 'wrist_3_link',
    'robotiq_base_link',
    'left_inner_knuckle', 'left_inner_finger', 'left_outer_knuckle', 'left_outer_finger',
    'right_inner_knuckle', 'right_inner_finger', 'right_outer_knuckle', 'right_outer_finger',
];
const ARM_LINK_STATE_KEYS = ARM_LINK_NAMES.flatMap(link =>
    [`${link}_x`, `${link}_y`, `${link}_z`, `${link}_qw`, `${link}_qx`, `${link}_qy`, `${link}_qz`]
);
// Full state key order (must match server STATE_KEYS / omnireset.proto State.values)
const STATE_KEYS = [
    ...ARM_LINK_STATE_KEYS,
    'ins_x', 'ins_y', 'ins_z', 'ins_qw', 'ins_qx', 'ins_qy', 'ins_qz',
    'rec_x', 'rec_y', 'rec_z', 'rec_qw', 'rec_qx', 'rec_qy', 'rec_qz',
];

const _pbTypes = {
    ClientToServer: omniProto.ClientToServer,
    ServerToClient: omniProto.ServerToClient,
};
function getPbTypes() {
    return _pbTypes;
}

function sendPbStop(ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
        const pb = getPbTypes();
        const msg = pb.ClientToServer.create({ stop: {} });
        ws.send(pb.ClientToServer.encode(msg).finish());
    } catch (e) {}
}

class UR5eRobot extends Asset {
    constructor(robot_cfg) {
        super(ARM_LINK_STATE_KEYS);
    }

    update(dt) {
        super.update(dt);
        if (this.state == null) return;
        for (let i = 0; i < ARM_LINK_NAMES.length; i++) {
            const obj = sceneRoot.getObjectByName(ARM_LINK_NAMES[i]);
            if (!obj) continue;
            const base = i * 7;
            const x = this.state[base], y = this.state[base + 1], z = this.state[base + 2];
            const qw = this.state[base + 3], qx = this.state[base + 4], qy = this.state[base + 5], qz = this.state[base + 6];
            if (![x, y, z, qw, qx, qy, qz].every(isFiniteNumber)) continue;
            _worldPosObj.set(x, z, -y);
            if (obj.parent) obj.parent.worldToLocal(_worldPosObj);
            obj.position.copy(_worldPosObj);
            _worldQuatObj.set(qx, qy, qz, qw);
            _worldQuatObj.premultiply(_quatX90CW);
            if (obj.parent) {
                obj.parent.getWorldQuaternion(_parentQuatObj).invert();
                _worldQuatObj.premultiply(_parentQuatObj);
            }
            obj.quaternion.copy(_worldQuatObj);
        }
    }

    parseTrajectoryRowForSetpoint(row) {
        return super.parseTrajectoryRowForSetpoint(row);
    }
}

class InsertiveObject extends Asset {
    static STATE_KEYS = ["ins_x","ins_y","ins_z","ins_qw","ins_qx","ins_qy","ins_qz"];

    constructor() {
        super(InsertiveObject.STATE_KEYS);
    }

    parseTrajectoryRowForSetpoint(row) {
        const setpoint = [];
        for (let i = 0; i < this.state_keys.length; i++) {
            const k = this.state_keys[i];
            setpoint.push(typeof row[k] === 'number' ? row[k] : parseFloat(row[k]) || 0);
        }
        return setpoint;
    }

    update(dt) {
        super.update(dt);
        if (this.state == null) return;
        const insertive_object = sceneRoot.getObjectByName("InsertiveObject");
        if (insertive_object == null) return;
        const x = this.state[0], y = this.state[1], z = this.state[2];
        const qw = this.state[3], qx = this.state[4], qy = this.state[5], qz = this.state[6];
        if (![x, y, z, qw, qx, qy, qz].every(isFiniteNumber)) return;
        // Isaac Z-up (x,y,z) -> Three.js Y-up (x, z, -y)
        _worldPosObj.set(x, z, -y);
        if (insertive_object.parent) insertive_object.parent.worldToLocal(_worldPosObj);
        insertive_object.position.copy(_worldPosObj);
        _worldQuatObj.set(qx, qy, qz, qw).premultiply(_quatX90CW);
        if (insertive_object.parent) {
            insertive_object.parent.getWorldQuaternion(_parentQuatObj).invert();
            _worldQuatObj.premultiply(_parentQuatObj);
        }
        insertive_object.quaternion.copy(_worldQuatObj);
    }
}

class ReceptiveObject extends Asset {
    static STATE_KEYS = ["rec_x","rec_y","rec_z","rec_qw","rec_qx","rec_qy","rec_qz"];

    constructor() {
        super(ReceptiveObject.STATE_KEYS);
    }

    parseTrajectoryRowForSetpoint(row) {
        const setpoint = [];
        for (let i = 0; i < this.state_keys.length; i++) {
            const k = this.state_keys[i];
            setpoint.push(typeof row[k] === 'number' ? row[k] : parseFloat(row[k]) || 0);
        }
        return setpoint;
    }

    update(dt) {
        super.update(dt);
        if (this.state == null) return;
        const receptive_object = sceneRoot.getObjectByName("ReceptiveObject");
        if (receptive_object == null) return;
        const x = this.state[0], y = this.state[1], z = this.state[2];
        const qw = this.state[3], qx = this.state[4], qy = this.state[5], qz = this.state[6];
        if (![x, y, z, qw, qx, qy, qz].every(isFiniteNumber)) return;
        // Isaac Z-up (x,y,z) -> Three.js Y-up (x, z, -y)
        _worldPosObj.set(x, z, -y);
        if (receptive_object.parent) receptive_object.parent.worldToLocal(_worldPosObj);
        receptive_object.position.copy(_worldPosObj);
        _worldQuatObj.set(qx, qy, qz, qw).premultiply(_quatX90CW);
        if (receptive_object.parent) {
            receptive_object.parent.getWorldQuaternion(_parentQuatObj).invert();
            _worldQuatObj.premultiply(_parentQuatObj);
        }
        receptive_object.quaternion.copy(_worldQuatObj);
    }
}

// Streaming sends one state per physics step: 120 Hz.
const STATE_REFRESH_MS = 5.0;
const STREAMING_HZ = 120;
const STREAMING_SETPOINT_INTERVAL_MS = 1000 / STREAMING_HZ;

class Env {
    constructor() {
        this.assets = [];
        this.env_initialized = false;
        this.setpoint_interval_ms = STREAMING_SETPOINT_INTERVAL_MS;
    }

    registerAsset(asset) {
        this.assets.push(asset);
    }

    setSetpointIntervalMs(ms) {
        this.setpoint_interval_ms = ms;
    }

    reset(initial_state_row) {
        this.env_initialized = true;

        this.assets.forEach(asset => {
            asset.reset(initial_state_row);
        });
    }

    update(dt) {
        if (this.env_initialized) {
            this.assets.forEach(asset => {
                asset.update(dt);
            });
        }
    }

    commandSetpoints(new_setpoint) {
        if (this.env_initialized) {
            this.assets.forEach(asset => {
                asset.commandNewSetpoint(new_setpoint);
            });
        }
    }

    stop() {
        this.env_initialized = false;
    }

    isInitialized() { return this.env_initialized; }
}

let env = new Env();
let envReady = false;
/** WebSocket for current play session; set when streaming starts, cleared on close. Used by Disturb. */
let playWebSocket = null;

function ensureEnvReady() {
    if (envReady) return Promise.resolve();
    return fetch(`${ASSETS_BASE}/UR5e.json`)
        .then(response => response.json())
        .then(robot_cfg => {
            const robot = new UR5eRobot(robot_cfg);
            const insertive_object = new InsertiveObject();
            const receptive_object = new ReceptiveObject();
            env.registerAsset(robot);
            env.registerAsset(insertive_object);
            env.registerAsset(receptive_object);
            envReady = true;
        });
}

ensureEnvReady().then(() => env.reset(TASK_INITIAL_STATES[getActiveTask()] ?? DRAWER_INITIAL_STATE));

async function playTrajectory() {
    if (playWebSocket) {
        sendPbStop(playWebSocket);
        playWebSocket.close();
        playWebSocket = null;
    }
    env.stop();
    startRendering();
    await ensureEnvReady();
    const pb = getPbTypes();
    env.setSetpointIntervalMs(STREAMING_SETPOINT_INTERVAL_MS);
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/play`);
    playWebSocket = ws;
    ws.binaryType = 'arraybuffer';
    const taskId = getActiveTask();
    let first = true;
    ws.onopen = () => {
        const playReq = { playRequest: { task: taskId } };
        const err = pb.ClientToServer.verify(playReq);
        if (err) return;
        const msg = pb.ClientToServer.create(playReq);
        ws.send(pb.ClientToServer.encode(msg).finish());
    };
    ws.onmessage = (event) => {
        if (playWebSocket !== ws) return;
        let row;
        try {
            const buf = new Uint8Array(event.data);
            const serverMsg = pb.ServerToClient.decode(buf);
            if (serverMsg.errorMsg) {
                row = { error: serverMsg.errorMsg.message };
            } else if (serverMsg.complete) {
                row = { complete: true };
            } else if (serverMsg.state) {
                const vals = serverMsg.state.values || [];
                row = {};
                for (let i = 0; i < STATE_KEYS.length; i++) {
                    row[STATE_KEYS[i]] = i < vals.length ? vals[i] : 0;
                }
            } else {
                return;
            }
        } catch (e) {
            return;
        }
        try {
            if (row && row.error) return;
            if (row && row.complete) {
                env.stop();
                ws.close();
                stopRendering();
                return;
            }
            if (first) {
                if (row && typeof row === 'object' && 'shoulder_link_x' in row) {
                    env.reset(row);
                    insertiveContainer.visible = true;
                    receptiveContainer.visible = true;
                    first = false;
                }
            } else {
                env.commandSetpoints(row);
            }
        } catch (e) {}
    };
    ws.onclose = () => {
        first = true;
        if (playWebSocket === ws) playWebSocket = null;
    };
    ws.onerror = () => {
        if (playWebSocket === ws) playWebSocket = null;
    };
}

document.getElementById("playTrajectory").addEventListener("click", playTrajectory);

// Progressive tutorial hints
const hintDisturb = document.getElementById('hintDisturb');
const hintDrag = document.getElementById('hintDrag');
const hintReset = document.getElementById('hintReset');
const hintTask = document.getElementById('hintTask');
let tutorialStep = 0; // 0=waiting for play, 1=disturb, 2=drag, 3=reset, 4=task, 5=done

function showHint(el) {
    if (!el) return;
    el.classList.remove('demo-hint--hidden');
    el.classList.add('demo-hint--visible');
}
function hideHint(el) {
    if (!el) return;
    el.classList.remove('demo-hint--visible');
    el.classList.add('demo-hint--hidden');
}

const overlayPlayBtn = document.getElementById("overlayPlayBtn");
if (overlayPlayBtn) {
    overlayPlayBtn.addEventListener("click", () => {
        const overlay = document.getElementById('demoOverlay');
        const controls = document.getElementById('demoControls');
        if (overlay) overlay.classList.add('hidden');
        if (controls) controls.classList.remove('demo-controls--hidden');
        playTrajectory();
        if (tutorialStep === 0) {
            tutorialStep = 1;
            setTimeout(() => showHint(hintDisturb), 1500);
        }
    });
}

document.getElementById("disturb").addEventListener("click", async () => {
    if (!playWebSocket || playWebSocket.readyState !== WebSocket.OPEN) return;
    try {
        const pb = getPbTypes();
        const msg = pb.ClientToServer.create({ disturb: {} });
        playWebSocket.send(pb.ClientToServer.encode(msg).finish());
    } catch (e) {}
    if (tutorialStep === 1) {
        tutorialStep = 2;
        hideHint(hintDisturb);
        setTimeout(() => showHint(hintDrag), 800);
    }
});

// Dismiss drag hint on first pointer drag or scroll on the canvas
if (container) {
    const dismissDragHint = () => {
        if (tutorialStep === 2) {
            tutorialStep = 3;
            hideHint(hintDrag);
            setTimeout(() => { if (tutorialStep === 3) showHint(hintReset); }, 20000);
            setTimeout(() => { if (tutorialStep <= 4) { hideHint(hintReset); tutorialStep = Math.max(tutorialStep, 4); showHint(hintTask); } }, 30000);
        }
    };
    container.addEventListener('pointerdown', () => {
        const onMove = () => { dismissDragHint(); container.removeEventListener('pointermove', onMove); };
        container.addEventListener('pointermove', onMove, { once: false });
        container.addEventListener('pointerup', () => container.removeEventListener('pointermove', onMove), { once: true });
    });
    container.addEventListener('touchmove', dismissDragHint, { once: true });
    container.addEventListener('wheel', dismissDragHint, { once: true });
}

// Dismiss reset hint when Reset is clicked
document.getElementById("playTrajectory").addEventListener("click", () => {
    if (tutorialStep === 3) {
        tutorialStep = 4;
        hideHint(hintReset);
    }
});

// Dismiss task hint when a tab is clicked
taskTabBar?.querySelectorAll('.demo-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        if (tutorialStep === 4) {
            tutorialStep = 5;
            hideHint(hintTask);
        }
    });
});

// Reusable temporaries for world-to-local conversion (insertive/receptive objects)
const _worldPosObj = new THREE.Vector3();
const _worldEulerObj = new THREE.Euler();
const _worldQuatObj = new THREE.Quaternion();
const _parentQuatObj = new THREE.Quaternion();
// 90° clockwise around X for insertive/receptive
const _quatX90CW = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

const _worldPosRobot = new THREE.Vector3();
const _worldPosInsertive = new THREE.Vector3();
let _logWorldPosCounter = 0;

// Refresh state (interpolation toward setpoints); DT matches setpoint rate (120 Hz streaming)
setInterval(() => {
    if (env.isInitialized()) {
        try {
            const dt = STATE_REFRESH_MS / env.setpoint_interval_ms;
            env.update(dt);
        } catch (e) {}
        if (++_logWorldPosCounter % 20 === 0) {
            const robotBase = sceneRoot.getObjectByName("base_link");
            const insertiveObject = sceneRoot.getObjectByName("InsertiveObject");
        }
    }
}, STATE_REFRESH_MS);

let renderingActive = false;

function animate() {
    controls.update();
    renderer.render( scene, camera );
}

function startRendering() {
    if (!renderingActive) {
        renderingActive = true;
        renderer.setAnimationLoop(animate);
    }
}

function stopRendering() {
    if (renderingActive) {
        renderingActive = false;
        renderer.setAnimationLoop(null);
        renderer.render(scene, camera);
    }
}

// Render on-demand when user orbits/zooms while animation loop is paused
controls.addEventListener('change', () => {
    if (!renderingActive) {
        renderer.render(scene, camera);
    }
});

startRendering();
window.dispatchEvent(new Event('demo-ready'));
