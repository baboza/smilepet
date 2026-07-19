"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, writeBatch, collection, getDocs, deleteDoc } from "firebase/firestore";
import { OPD_DATA } from "./opd_data";

const OWNERS_DATA = [
  { key: "aff5414b", name: "ตอง", phone: "0855920630" },
  { key: "68163049", name: "เจ้าของนมสด", phone: "0997898826" },
  { key: "84844f86", name: "ฟิน", phone: "0985657089" },
  { key: "071917b2", name: "นัทนรี", phone: "0832287672" },
  { key: "0df3f9f3", name: "ปาล์ม", phone: "0844530249" },
  { key: "cb9124bb", name: "กี้", phone: "0986019056" },
  { key: "cb06a83a", name: "ด้า", phone: "0973186655" },
  { key: "b3f8ac1e", name: "ต๋อ", phone: "0949946394" },
  { key: "1ec73982", name: "พัชรินทร", phone: "0626359239" },
  { key: "d780f088", name: "อาทิตย์", phone: "0993791403" },
  { key: "6d2c67ac", name: "ไพบูน", phone: "0851105822" },
  { key: "c5b98767", name: "ฉัตรชัย", phone: "0804289620" },
  { key: "19629652", name: "มิ้น", phone: "0615351142" },
  { key: "f0f6c861", name: "อ.ต้อง", phone: "0896196489" },
  { key: "32af1374", name: "เอมอร", phone: "0899196322" },
  { key: "0ad05b26", name: "หนึ่ง", phone: "0877744422" },
  { key: "97a8e162", name: "ดาว", phone: "0952131006" },
  { key: "b5551a42", name: "Piw", phone: "0987546036" },
  { key: "11cf8ab1", name: "ตั๊ก", phone: "0805563595" },
  { key: "59d79fce", name: "ต้น", phone: "0929743043" },
  { key: "fd248599", name: "นัทลิตา", phone: "0616536192" },
  { key: "ddd242a8", name: "นัท", phone: "0956597878" },
  { key: "b2821479", name: "กัส", phone: "0928841956" },
  { key: "6728144f", name: "บอล", phone: "0933404985" },
  { key: "4ba2b962", name: "ดาว", phone: "0616369997" },
  { key: "34ba86b7", name: "มิน", phone: "0656305375" },
  { key: "59385e1b", name: "เบิ้ม", phone: "0819827931" },
  { key: "08f759a9", name: "ออม", phone: "0644746548" },
  { key: "d1003a95", name: "เปิ้ล", phone: "0994652159" },
  { key: "78ee6836", name: "คิดตี้", phone: "0943939924" },
  { key: "d6d9f64a", name: "ปุ้ย", phone: "0933212762" },
  { key: "c93c61e4", name: "เจ้าของชาไทย โอเลี้ยง", phone: "0622873453" },
  { key: "19796a01", name: "ก้อย", phone: "0996293669" },
  { key: "f714895c", name: "บุญเรือง", phone: "0984309930" },
  { key: "c3b1f2d9", name: "บ้านเนเน่", phone: "0642433617" },
  { key: "80c31b2f", name: "วุ้นเส้น", phone: "0636756836" },
  { key: "6f65cf78", name: "ภูริทัศ", phone: "0919837447" },
  { key: "82cff306", name: "ณัฐนรี", phone: "0857446939" },
  { key: "c4edebf6", name: "ออมสิน", phone: "0934299639" },
  { key: "2f66340d", name: "เจ้าของป๊อบคอน", phone: "0812610184" },
  { key: "dcc10abd", name: "นิวตัน", phone: "0930817055" },
  { key: "6a2f8684", name: "ยุพิน", phone: "0956625192" },
  { key: "db7a8d5c", name: "เจ้าของปอมปอม ไอพอต", phone: "0885731017" },
  { key: "ec0d9526", name: "ส้ม", phone: "0969494455" },
  { key: "c2df9b8b", name: "เจ้าของปีใหม่", phone: "0935580383" },
  { key: "4de63dbb", name: "จุ๊บแจง", phone: "0646656836" },
  { key: "962afdac", name: "นิก", phone: "0639491333" },
  { key: "cdc51354", name: "นาเดีย", phone: "0924852654" },
  { key: "ad18df71", name: "แคท", phone: "0639964778" },
  { key: "92d38ad7", name: "วรัญญา", phone: "0930280564" },
  { key: "b4974b48", name: "แป๋ม", phone: "0873745333" },
  { key: "eba991bf", name: "ภัทร", phone: "0876421071" },
  { key: "a6c355c4", name: "รัตศมี", phone: "0986612834" },
  { key: "3b8044ef", name: "ต้นอ้อ", phone: "0641711383" },
  { key: "614220c5", name: "กิ่ง", phone: "0879882406" },
  { key: "97fbc55d", name: "เล", phone: "0989215521" },
  { key: "7ac9828f", name: "จุ๊บแจง", phone: "0946461382" },
  { key: "a17c0b62", name: "แยม", phone: "0951918528" },
  { key: "904b38cf", name: "มะปราง", phone: "0876388352" },
  { key: "613ad302", name: "ซอฟ", phone: "0981211404" },
  { key: "b08c6d0b", name: "หัว", phone: "0637322253" },
  { key: "167dca36", name: "บัณฑิต", phone: "0866452600" },
  { key: "865809de", name: "ฟ้า", phone: "0866343309" },
  { key: "c6fdc9be", name: "จุ่มจิ้ม", phone: "0815288894" },
  { key: "8610cda9", name: "ดิว", phone: "0908599231" },
  { key: "b557a49f", name: "เจ้าของออกัส", phone: "0863101116" },
  { key: "5e7293c5", name: "ปลายอ้อ", phone: "0868534245" },
  { key: "64dd19fd", name: "บลู", phone: "0803870219" },
  { key: "476da4d3", name: "นัชชา", phone: "0853354455" },
  { key: "64ca032e", name: "แป้ง", phone: "0881661777" },
  { key: "b4b8c8e5", name: "ลิด", phone: "0645293485" },
  { key: "35137862", name: "เจ้าของลูฟี่", phone: "0854596169" },
  { key: "a8ac8631", name: "เจี๊ยบ", phone: "0637344148" },
  { key: "21b609be", name: "ธัญญาลักษณ์", phone: "0932392394" },
  { key: "59c4e5ff", name: "พี่นิว", phone: "0813697224" },
  { key: "40ab981c", name: "ปุ้ม", phone: "0922954195" },
  { key: "6ea2d16f", name: "ชลดา", phone: "0951918528" },
  { key: "f6882f4e", name: "เจ้าของยูกิ", phone: "0989399455" },
  { key: "cc64e4be", name: "มะลิ", phone: "0902470066" },
  { key: "127c1e37", name: "บ้านฝิ่น กระท่อม", phone: "" },
  { key: "ef197740", name: "พูนศักดิ์", phone: "0913951665" },
  { key: "9953a157", name: "หนึ่ง", phone: "0957376579" },
  { key: "86414a5f", name: "เจ้าของแลมโบ", phone: "0957809654" },
  { key: "e7e4d6b4", name: "วัยวุฒิ", phone: "0942916938" },
  { key: "3087b0c2", name: "เจ้าของชัปปุย", phone: "0916932953" },
  { key: "c5d739bd", name: "นุช", phone: "0621729581" },
  { key: "9be05ba2", name: "เจ้าของเซฟเฟอร์", phone: "0822731354" },
  { key: "575da94c", name: "อรยา", phone: "0970977288" },
  { key: "54183555", name: "อนง", phone: "0996436617" },
  { key: "4b63990d", name: "บดินชัย", phone: "0934269148" },
  { key: "e3909452", name: "เจ้าของหัวโต-ยูโร", phone: "0981524546" },
  { key: "9fe8cfe6", name: "ภูริตา", phone: "0864598915" },
  { key: "b071f2b1", name: "อ้อม", phone: "0625055129" },
  { key: "433f6ffc", name: "เมย์", phone: "0949079688" },
  { key: "16bba394", name: "ชนพร", phone: "0937529642" },
  { key: "b29309ee", name: "รุ่งทิพย์", phone: "0946461382" },
  { key: "52a16f11", name: "ต้นอ้อ", phone: "0623694603" },
  { key: "536d67e0", name: "เอี้ยง", phone: "0988923608" },
  { key: "40080274", name: "โบ๊ท", phone: "0981044716" },
  { key: "29143136", name: "เจ้าของนับเงิน", phone: "0891713973" },
  { key: "d8321c55", name: "พงธ์", phone: "0956148989" },
  { key: "9835ef81", name: "ต่อศักดิ์", phone: "0885393323" },
  { key: "cd28d79f", name: "นิก", phone: "0883354357" },
  { key: "bb955e34", name: "กิ๊ฟ", phone: "0644615942" },
  { key: "e193f07e", name: "แม่ต๋อย", phone: "0895779748" },
  { key: "3855bf12", name: "มิ้น", phone: "0832270134" },
  { key: "2e319c7b", name: "มะเหมี่ยว", phone: "0803804011" },
  { key: "d3a17915", name: "น้อย", phone: "0643306996" },
  { key: "f037ade3", name: "วัชรกร", phone: "0810232563" },
  { key: "b5d6bc8b", name: "เจ้าของโนอา แมว", phone: "0954653949" },
  { key: "76d835c2", name: "เจ้าของสยาม", phone: "0816321789" },
  { key: "059179c9", name: "มิ้น", phone: "0821915955" },
  { key: "37b256f4", name: "โกสิน", phone: "0945751209" },
  { key: "d1106fec", name: "อายู", phone: "0888888888" },
  { key: "e6564c17", name: "มิ้น", phone: "0820753282" },
  { key: "e94d9b52", name: "เบญจวรรณ", phone: "0659589522" },
  { key: "55402d49", name: "เจ้าของ ไมโล เฮงเฮง", phone: "0621277385" },
  { key: "26c17eba", name: "ทัศนีย์", phone: "0896208101" },
  { key: "fbf5efd0", name: "เจ้าของดอปบี้", phone: "0861456773" },
  { key: "e323b2a1", name: "เตย", phone: "0944454369" },
  { key: "e78a18d3", name: "ปาล์ม", phone: "0931070462" },
  { key: "3d64d2f6", name: "เจ้าของยูริ", phone: "0649180208" },
  { key: "77fdf01c", name: "เตย", phone: "0832287672" },
  { key: "bd403e41", name: "วิภา", phone: "0638307284" },
  { key: "73049778", name: "เตย", phone: "0892001432" },
  { key: "4379b6d1", name: "นิก", phone: "0944466444" },
  { key: "b804682f", name: "เจ้าของออนลี่", phone: "0625145590" },
  { key: "71b87152", name: "เจ้าของบ้อบบี้", phone: "0910659923" },
  { key: "bf323ec2", name: "โจ้", phone: "0994565598" },
  { key: "af44d818", name: "อิคิว", phone: "0803400089" },
  { key: "639fc869", name: "คมกฤษ", phone: "0811379440" },
  { key: "f4992512", name: "หมวย", phone: "0937092234" },
  { key: "9bd09af4", name: "เจ้าของน้ำหวาน", phone: "0832395599" },
  { key: "83e0f685", name: "เจ้าของส้ม", phone: "0877754754" },
  { key: "afef841b", name: "เจ้าของออมสิน", phone: "0878775908" },
  { key: "cb4198db", name: "ดอม", phone: "0964142323" },
  { key: "d6da84b1", name: "ไข่มุก", phone: "0842907939" },
  { key: "05a3d730", name: "เอ็ม", phone: "0614169094" },
  { key: "6d81f1e5", name: "ฝ้าย", phone: "0638690345" },
  { key: "9b578b6d", name: "น้ำหนาว", phone: "0969548598" },
  { key: "05f1f71d", name: "สุพชัย", phone: "0913589502" },
  { key: "2b6a48e9", name: "เจ้าของอั่งเปา", phone: "0924966289" },
  { key: "6067c9dc", name: "เดท", phone: "0874362981" },
  { key: "d314a4c6", name: "ฟลุ้ค", phone: "0655402285" },
  { key: "64c5564a", name: "ตีส", phone: "0910618452" },
  { key: "839a6e43", name: "เจ้าของชาบู โอ๋", phone: "0649499424" },
  { key: "f43ffd7a", name: "ไอซ์", phone: "0855852525" },
  { key: "dbe646a5", name: "นัชชา", phone: "0809600746" },
  { key: "ce7193eb", name: "มาร์ค", phone: "0637409744" },
  { key: "cda9c1ba", name: "ญา", phone: "0932522554" },
  { key: "ca8f055f", name: "แป๋วแหว่ว", phone: "0613081941" },
  { key: "a59e633b", name: "ต๊อก", phone: "0835935544" },
  { key: "c2d7cdf0", name: "ต้อม", phone: "0834173999" },
  { key: "e4e7c5db", name: "ข้าวฟาง", phone: "0968643347" },
  { key: "bfb6b911", name: "ปั้ก", phone: "0992859641" },
  { key: "4501cfff", name: "ออมสิน", phone: "0834745362" },
  { key: "0afa9af1", name: "สุพัฒน์", phone: "0982921599" },
  { key: "6773b8f4", name: "กุลธิดา", phone: "0856314425" },
  { key: "3da36fba", name: "คุณมด", phone: "0840423264" },
  { key: "adbaefb2", name: "K.เฟิร์น", phone: "0954539714" },
  { key: "57941ef0", name: "รัชชานนท์", phone: "0858537257" },
  { key: "c38f69c9", name: "ปารณี", phone: "0834173999" },
  { key: "3beecd2f", name: "แจง", phone: "0951811164" },
  { key: "43ade72c", name: "นัชชานน", phone: "0613352149" },
  { key: "3d102bb8", name: "คิดติ", phone: "0646549561" },
  { key: "cbe436c8", name: "เบล", phone: "0809878626" },
  { key: "e1395f4e", name: "ไอซ์", phone: "0610862426" },
  { key: "9e49ea57", name: "แพร", phone: "0924619215" },
  { key: "89b1d2b7", name: "อรวิทล", phone: "0860606184" },
  { key: "e9516c44", name: "บุ๋ม", phone: "0931866909" },
  { key: "b3aa9051", name: "พิประพร", phone: "0958398263" },
  { key: "6653f5f9", name: "นุ่น", phone: "0924619215" },
  { key: "0b1c6dbe", name: "สุกัญญา ป้อมแสงสี", phone: "0942252578" },
  { key: "e84cbd07", name: "ดิว", phone: "0826654555" },
  { key: "6cf63601", name: "นุ่น", phone: "0648230805" },
  { key: "cf030786", name: "อรญา", phone: "0971977812" },
  { key: "f98b830f", name: "เจม", phone: "0622173565" },
  { key: "210a692e", name: "อ.สุนทรี", phone: "0889457427" },
  { key: "54595d47", name: "ณหทัย", phone: "0657478916" },
  { key: "9d202d31", name: "คุณหมอ", phone: "" },
  { key: "ca99cb02", name: "ผักกาด", phone: "0636390885" },
  { key: "cd46b8ea", name: "เจ้าของเฟยเฟย", phone: "0817998473" },
  { key: "172880a8", name: "โดนัท", phone: "0846936268" },
  { key: "61eb9e8a", name: "ธารารัตน์", phone: "0637256622" },
  { key: "1ff3f40a", name: "ชนินธร", phone: "0633531796" },
  { key: "8ec63de0", name: "สุวิชา", phone: "0840275758" },
  { key: "81688d9e", name: "สุภาพร", phone: "0815378827" },
  { key: "f85f9bdb", name: "มนธิดา", phone: "0638261366" },
  { key: "6b2b69f5", name: "บุ๋ม", phone: "0931866909" },
  { key: "06cf7682", name: "แป้ง", phone: "0957716085" },
  { key: "1cccbb25", name: "เทอรี่", phone: "0928546653" },
  { key: "47d93492", name: "คุณหวาน", phone: "0810991385" },
  { key: "14dacd85", name: "คุณแม่จิ๊บ", phone: "0812639231" },
  { key: "f83efc84", name: "ศราวุธ", phone: "0981762777" },
  { key: "08e2e0fd", name: "รัตชนี", phone: "0617810299" },
  { key: "b92b5012", name: "บีณา", phone: "0967494854" },
  { key: "15bf4100", name: "แอม", phone: "0821674711" },
  { key: "dd81aa0e", name: "โต", phone: "0934936554" },
  { key: "99d7785a", name: "จีจี้", phone: "0845185626" },
];

const PETS_DATA = [
  { ownerId: "aff5414b", name: "ซาโบ", species: "สุนัข", breed: "ปอม", birth: "9/9/2024", color: "ครีม", sex: "ผู้", sterilization: "", image: "36ec33ed.Image.060015.jpg" },
  { ownerId: "68163049", name: "นมสด", species: "สุนัข", breed: "ปอม", birth: "1/5/2022", color: "ครีม", sex: "เมีย", sterilization: "", image: "b039bf3a.Image.063307.jpg" },
  { ownerId: "84844f86", name: "เทเลอร์", species: "สุนัข", breed: "พุดเดิ้ลทอย", birth: "9/5/2024", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "15fb775b.Image.064020.jpg" },
  { ownerId: "071917b2", name: "เต้าหู้", species: "สุนัข", breed: "ชิสุ", birth: "3/11/2020", color: "ขาว", sex: "เมีย", sterilization: "", image: "85c6b347.Image.075253.jpg" },
  { ownerId: "0df3f9f3", name: "สมศรี", species: "แมว", breed: "เปอร์เซีย", birth: "2/9/2023", color: "สามสี", sex: "เมีย", sterilization: "", image: "d3c6f466.Image.083953.jpg" },
  { ownerId: "0df3f9f3", name: "น้อย", species: "แมว", breed: "เปอร์เซีย", birth: "2/7/2023", color: "เทา", sex: "เมีย", sterilization: "", image: "f3b47d25.Image.084210.jpg" },
  { ownerId: "0df3f9f3", name: "ตำลึง", species: "แมว", breed: "เปอร์เซีย", birth: "3/2/2022", color: "ขาว ดำ", sex: "ผู้", sterilization: "", image: "5acde0b5.Image.084444.jpg" },
  { ownerId: "0df3f9f3", name: "ฟักทอง", species: "แมว", breed: "เปอร์เซีย", birth: "7/7/2021", color: "เปอร์เซีย", sex: "เมีย", sterilization: "", image: "ef26f786.Image.084631.jpg" },
  { ownerId: "0df3f9f3", name: "ผัดกาด", species: "แมว", breed: "เปอร์เซีย", birth: "6/8/2021", color: "ขาว", sex: "เมีย", sterilization: "", image: "3283b2c7.Image.084819.jpg" },
  { ownerId: "0df3f9f3", name: "กะหล่ำ", species: "แมว", breed: "เปอร์เซีย", birth: "3/4/2021", color: "เทา ขาว", sex: "ผู้", sterilization: "", image: "736300a5.Image.084958.jpg" },
  { ownerId: "0df3f9f3", name: "คุณใหญ่", species: "แมว", breed: "เปอร์เซีย", birth: "1/28/2020", color: "สามสี", sex: "ผู้", sterilization: "", image: "5479518f.Image.085444.jpg" },
  { ownerId: "0df3f9f3", name: "อาตัง", species: "แมว", breed: "เปอร์เซีย", birth: "1/31/2018", color: "เทา", sex: "ผู้", sterilization: "", image: "3af264e5.Image.085613.jpg" },
  { ownerId: "cb9124bb", name: "อาโป", species: "แมว", breed: "สกอตติซ", birth: "2/4/2023", color: "ขาว ส้ม", sex: "ผู้", sterilization: "", image: "9c7ca56b.Image.101753.jpg" },
  { ownerId: "cb06a83a", name: "บู้บี้", species: "สุนัข", breed: "ปอม", birth: "1/12/2024", color: "ครีม", sex: "ผู้", sterilization: "", image: "0a0a1f30.Image.051300.jpg" },
  { ownerId: "b3f8ac1e", name: "ทะเล", species: "สุนัข", breed: "ปอม", birth: "1/6/2023", color: "ครีม", sex: "เมีย", sterilization: "", image: "d5b347b6.Image.095104.jpg" },
  { ownerId: "1ec73982", name: "ส้มฉุน", species: "แมว", breed: "ไทย", birth: "9/8/2022", color: "ส้ม", sex: "ผู้", sterilization: "", image: "e4c1f461.Image.104219.jpg" },
  { ownerId: "d780f088", name: "ชาวี", species: "แมว", breed: "สกอตติช", birth: "9/18/2024", color: "ส้ม", sex: "ผู้", sterilization: "", image: "a47359e6.Image.112437.jpg" },
  { ownerId: "6d2c67ac", name: "เดือน", species: "สุนัข", breed: "บางแก้ว", birth: "1/12/2016", color: "ครีม", sex: "เมีย", sterilization: "", image: "cf19cad7.Image.114952.jpg" },
  { ownerId: "c5b98767", name: "แพนด้า", species: "แมว", breed: "ไทย", birth: "1/11/2023", color: "ขาว ดำ", sex: "ผู้", sterilization: "", image: "b46a5671.Image.103045.jpg" },
  { ownerId: "19629652", name: "ข้าวสวย", species: "สุนัข", breed: "ชิสุ", birth: "11/15/2023", color: "ขาว ดำ", sex: "เมีย", sterilization: "", image: "6995b265.Image.104424.jpg" },
  { ownerId: "19629652", name: "แพนด้า", species: "สุนัข", breed: "ชิสุ", birth: "12/14/2023", color: "ขาว ดำ", sex: "ผู้", sterilization: "", image: "ee07b7a4.Image.104523.jpg" },
  { ownerId: "f0f6c861", name: "แอนนา", species: "สุนัข", breed: "ปอม", birth: "6/13/2023", color: "ขาว", sex: "เมีย", sterilization: "", image: "c5fadf1f.Image.112832.jpg" },
  { ownerId: "f0f6c861", name: "ลิ้นจี่", species: "สุนัข", breed: "บูลลี่", birth: "6/6/2023", color: "ลาย", sex: "เมีย", sterilization: "", image: "6b02204d.Image.112928.jpg" },
  { ownerId: "32af1374", name: "เสือดำ", species: "แมว", breed: "ไทย", birth: "1/9/2022", color: "ดำ", sex: "ผู้", sterilization: "", image: "a2cd3e64.Image.121416.jpg" },
  { ownerId: "0ad05b26", name: "ใบบัว", species: "แมว", breed: "สกอติช", birth: "1/19/2022", color: "ขาว", sex: "เมีย", sterilization: "", image: "a19a6c49.Image.051243.jpg" },
  { ownerId: "0ad05b26", name: "บีก้า", species: "แมว", breed: "สกอตติช", birth: "1/12/2022", color: "ขาว เทา", sex: "ผู้", sterilization: "", image: "6854aad4.Image.051349.jpg" },
  { ownerId: "b5551a42", name: "จูดี้", species: "แมว", breed: "เอกโซติก", birth: "11/18/2020", color: "ขาว ดำ", sex: "เมีย", sterilization: "", image: "77049562.Image.073332.jpg" },
  { ownerId: "11cf8ab1", name: "แซลมอน", species: "แมว", breed: "ไทย", birth: "10/23/2024", color: "ส้ม", sex: "ผู้", sterilization: "", image: "5e3440ac.Image.075715.jpg" },
  { ownerId: "97a8e162", name: "อ๋องอ๋อง", species: "สุนัข", breed: "ชิสุ", birth: "1/13/2022", color: "ขาว น้ำตาล", sex: "ผู้", sterilization: "", image: "e48da574.Image.081619.jpg" },
  { ownerId: "59d79fce", name: "เต่าทอง", species: "แมว", breed: "ไทย", birth: "9/15/2021", color: "สามสี", sex: "เมีย", sterilization: "", image: "aafa4189.Image.103914.jpg" },
  { ownerId: "fd248599", name: "คูก้า", species: "แมว", breed: "ไทย", birth: "6/14/2023", color: "ส้ม", sex: "ผู้", sterilization: "", image: "e5ab4ac2.Image.105633.jpg" },
  { ownerId: "cb06a83a", name: "ถุงเงิน", species: "สุนัข", breed: "ปอม", birth: "1/18/2024", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "ce63e7cf.Image.041739.jpg" },
  { ownerId: "ddd242a8", name: "โกฮัง", species: "สุนัข", breed: "ชามอย", birth: "1/16/2020", color: "ขาว", sex: "ผู้", sterilization: "", image: "64fe2324.Image.050616.jpg" },
  { ownerId: "b2821479", name: "ถุงเงิน", species: "สุนัข", breed: "ผสม", birth: "1/12/2022", color: "ครีม", sex: "เมีย", sterilization: "", image: "7ec73bf1.Image.110358.jpg" },
  { ownerId: "6728144f", name: "ฟู่ฟู่", species: "แมว", breed: "สกอติช", birth: "9/18/2024", color: "ขาว", sex: "เมีย", sterilization: "", image: "9b720eec.Image.113826.jpg" },
  { ownerId: "6728144f", name: "ปุ่ยเมฆ", species: "แมว", breed: "สกอตติซ", birth: "2/14/2024", color: "ขาว", sex: "เมีย", sterilization: "", image: "e09d7545.Image.114540.jpg" },
  { ownerId: "4ba2b962", name: "จร", species: "แมว", breed: "ไทย", birth: "1/16/2020", color: "ลาย", sex: "เมีย", sterilization: "", image: "c8093736.Image.105315.jpg" },
  { ownerId: "34ba86b7", name: "สตางค์", species: "แมว", breed: "ไทย", birth: "11/14/2024", color: "ดำ", sex: "ผู้", sterilization: "", image: "bfa1b3cb.Image.133608.jpg" },
  { ownerId: "59385e1b", name: "ฮารุ", species: "แมว", breed: "ผสม", birth: "1/16/2022", color: "ขาวส้ม", sex: "ผู้", sterilization: "", image: "a126439f.Image.101750.jpg" },
  { ownerId: "08f759a9", name: "นับตัง", species: "แมว", breed: "ไทย", birth: "2/16/2024", color: "เทา", sex: "ผู้", sterilization: "", image: "d5d84159.Image.115249.jpg" },
  { ownerId: "34ba86b7", name: "ถุงทอง", species: "แมว", breed: "ไทย", birth: "10/17/2024", color: "ลาย", sex: "เมีย", sterilization: "", image: "69055c66.Image.131534.jpg" },
  { ownerId: "34ba86b7", name: "ถุงเงิน", species: "แมว", breed: "ลาย", birth: "10/17/2024", color: "ลาย", sex: "เมีย", sterilization: "", image: "bd6e9f7a.Image.131612.jpg" },
  { ownerId: "d1003a95", name: "ชีต้า", species: "แมว", breed: "ไทย", birth: "", color: "เทา", sex: "เมีย", sterilization: "", image: "d63b8d4a.Image.031659.jpg" },
  { ownerId: "78ee6836", name: "กาแฟ", species: "สุนัข", breed: "ชิสุ", birth: "6/7/2023", color: "ขาว เทา", sex: "ผู้", sterilization: "", image: "19d62787.Image.031859.jpg" },
  { ownerId: "d6d9f64a", name: "จีจี้", species: "สุนัข", breed: "ชิวาวา", birth: "7/18/2024", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "60dfa574.Image.050430.jpg" },
  { ownerId: "c93c61e4", name: "ชาไทย", species: "สุนัข", breed: "ชิสุ", birth: "1/18/2022", color: "ขาว", sex: "ผู้", sterilization: "", image: "8d91dd28.Image.075535.jpg" },
  { ownerId: "c93c61e4", name: "โอเลี้ยง", species: "สุนัข", breed: "ชิสึ", birth: "1/18/2022", color: "ขาว", sex: "ผู้", sterilization: "", image: "caba6c71.Image.075616.jpg" },
  { ownerId: "19796a01", name: "แจ๊สเปอร์", species: "สุนัข", breed: "ปอม", birth: "9/15/2024", color: "ขาว", sex: "ผู้", sterilization: "", image: "755955b8.Image.063851.jpg" },
  { ownerId: "f714895c", name: "เสือ", species: "แมว", breed: "ไทย", birth: "1/19/2023", color: "ลาย", sex: "เมีย", sterilization: "", image: "574b53ea.Image.095327.jpg" },
  { ownerId: "f714895c", name: "สีสวาท", species: "แมว", breed: "ไทย", birth: "1/19/2022", color: "ลาย", sex: "เมีย", sterilization: "", image: "75b7cd22.Image.095407.jpg" },
  { ownerId: "c3b1f2d9", name: "รวยรวย", species: "แมว", breed: "เปอร์เซีย", birth: "1/19/2022", color: "สามสี", sex: "เมีย", sterilization: "", image: "74f6452c.Image.123057.jpg" },
  { ownerId: "c3b1f2d9", name: "เฮงเฮง", species: "แมว", breed: "เปอร์เซีย", birth: "1/19/2023", color: "ขาว", sex: "ผู้", sterilization: "", image: "28b18a05.Image.123140.jpg" },
  { ownerId: "80c31b2f", name: "ไข่ดาว", species: "แมว", breed: "ไทย", birth: "9/11/2024", color: "ขาวส้ม", sex: "ผู้", sterilization: "", image: "3623f9c8.Image.114935.jpg" },
  { ownerId: "80c31b2f", name: "ข้าวหอม", species: "แมว", breed: "", birth: "6/6/2024", color: "สลิด", sex: "ผู้", sterilization: "", image: "f4a8e4b0.Image.115022.jpg" },
  { ownerId: "6f65cf78", name: "เดียวดาย", species: "แมว", breed: "ไทย", birth: "11/12/2024", color: "ขาว เทา", sex: "เมีย", sterilization: "", image: "89cec95f.Image.105233.jpg" },
  { ownerId: "82cff306", name: "ไบตั้น", species: "แมว", breed: "สกอติช", birth: "6/6/2023", color: "ขาว", sex: "ผู้", sterilization: "", image: "6779a4f8.Image.035358.jpg" },
  { ownerId: "c4edebf6", name: "มะลิ", species: "สุนัข", breed: "ปอม", birth: "6/5/2024", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "529bc23b.Image.065034.jpg" },
  { ownerId: "c4edebf6", name: "มะลิ1", species: "สุนัข", breed: "ชิวาวา", birth: "6/6/2023", color: "น้ำตาล ขาว", sex: "ผู้", sterilization: "", image: "8fef95ba.Image.065134.jpg" },
  { ownerId: "c4edebf6", name: "มะลิ2", species: "สุนัข", breed: "ชิวาวา", birth: "10/16/2024", color: "น้ำตาล ขาว", sex: "ผู้", sterilization: "", image: "e2412e66.Image.065204.jpg" },
  { ownerId: "2f66340d", name: "ป๊อบคอน", species: "สุนัข", breed: "ปอม", birth: "6/7/2023", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "455c27b1.Image.065335.jpg" },
  { ownerId: "dcc10abd", name: "ชิปปี้", species: "แมว", breed: "เปอร์เซีย", birth: "6/15/2023", color: "ลาย", sex: "เมีย", sterilization: "", image: "b8743ce2.Image.082331.jpg" },
  { ownerId: "6a2f8684", name: "โคอี้", species: "แมว", breed: "สกอตติช", birth: "2/7/2023", color: "หินอ่อน", sex: "เมีย", sterilization: "", image: "008d6da7.Image.095015.jpg" },
  { ownerId: "db7a8d5c", name: "ปอมปอม", species: "สุนัข", breed: "ปอม", birth: "10/11/2021", color: "ขาว", sex: "ผู้", sterilization: "", image: "c28d4c58.Image.114533.jpg" },
  { ownerId: "db7a8d5c", name: "ไอพอต", species: "สุนัข", breed: "ปอม", birth: "10/11/2021", color: "ขาว", sex: "ผู้", sterilization: "", image: "8f003f83.Image.114630.jpg" },
  { ownerId: "f0f6c861", name: "เฮงๆ", species: "สุนัข", breed: "ปอม", birth: "1/20/2023", color: "ขาว", sex: "ผู้", sterilization: "", image: "56d81cde.Image.121654.jpg" },
  { ownerId: "ec0d9526", name: "แมกกี้", species: "สุนัข", breed: "ปอม", birth: "1/20/2022", color: "ขาว", sex: "ผู้", sterilization: "", image: "dba6ffb8.Image.130955.jpg" },
  { ownerId: "c2df9b8b", name: "ปีใหม่", species: "สุนัข", breed: "ปอม", birth: "6/12/2024", color: "ขาว", sex: "เมีย", sterilization: "", image: "9c720e89.Image.131403.jpg" },
  { ownerId: "4de63dbb", name: "อังเปา", species: "สุนัข", breed: "ปอม", birth: "6/7/2022", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "98c7364b.Image.041717.jpg" },
  { ownerId: "4de63dbb", name: "มิกกิ", species: "สุนัข", breed: "ชิวาวา", birth: "6/14/2023", color: "น้ำตาล ขาว", sex: "เมีย", sterilization: "", image: "635ed5fe.Image.041801.jpg" },
  { ownerId: "962afdac", name: "ฟิชชี่", species: "สุนัข", breed: "เฟรนบลูด๊อก", birth: "2/1/2023", color: "ดำ", sex: "ผู้", sterilization: "", image: "ae801d06.Image.072859.jpg" },
  { ownerId: "cdc51354", name: "กังฟู", species: "แมว", breed: "", birth: "7/12/2023", color: "ลาย", sex: "ผู้", sterilization: "", image: "ab380a81.Image.131555.jpg" },
  { ownerId: "ad18df71", name: "ไข่ตุ๋น", species: "แมว", breed: "เอ็กโซติก", birth: "11/13/2024", color: "ส้ม", sex: "ผู้", sterilization: "", image: "397d3402.Image.041101.jpg" },
  { ownerId: "92d38ad7", name: "ปากมอม", species: "สุนัข", breed: "ไทย", birth: "12/2/2024", color: "น้ำตาย", sex: "เมีย", sterilization: "", image: "0eb14e39.Image.073638.jpg" },
  { ownerId: "92d38ad7", name: "คอแดง", species: "สุนัข", breed: "ไทย", birth: "12/2/2024", color: "ดำ น้ำตาล", sex: "เมีย", sterilization: "", image: "8fd99d6c.Image.073735.jpg" },
  { ownerId: "92d38ad7", name: "คอดำ", species: "สุนัข", breed: "ไทย", birth: "12/2/2024", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "039f9363.Image.073815.jpg" },
  { ownerId: "92d38ad7", name: "มะขาม", species: "สุนัข", breed: "ไทย", birth: "12/2/2024", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "f18c5fe4.Image.074205.jpg" },
  { ownerId: "92d38ad7", name: "เตี้ย", species: "สุนัข", breed: "ไทย", birth: "12/2/2024", color: "น้ำตาล ขาว", sex: "เมีย", sterilization: "", image: "1be65668.Image.074306.jpg" },
  { ownerId: "92d38ad7", name: "คอส้ม", species: "สุนัข", breed: "ไทย", birth: "12/2/2024", color: "ดำ", sex: "เมีย", sterilization: "", image: "f8c9da7f.Image.074347.jpg" },
  { ownerId: "b4974b48", name: "ลักกี้", species: "สุนัข", breed: "คอกเอร์", birth: "11/10/2021", color: "ดำ", sex: "ผู้", sterilization: "", image: "358147fa.Image.075014.jpg" },
  { ownerId: "eba991bf", name: "นินิว", species: "แมว", breed: "เปอร์เซีย", birth: "7/6/2022", color: "ส้ม", sex: "ผู้", sterilization: "", image: "61f8e9a9.Image.080533.jpg" },
  { ownerId: "a6c355c4", name: "เจได", species: "สุนัข", breed: "พุดเดิ้ล", birth: "7/15/2021", color: "ขาว", sex: "ผู้", sterilization: "", image: "7bfc233f.Image.081819.jpg" },
  { ownerId: "614220c5", name: "เมี่ยง", species: "แมว", breed: "ไทย", birth: "6/8/2023", color: "ลาย", sex: "เมีย", sterilization: "", image: "63627739.Image.113633.jpg" },
  { ownerId: "97fbc55d", name: "เลออน", species: "แมว", breed: "สกอตติชโฟ", birth: "8/2/2024", color: "หินอ่อน", sex: "เมีย", sterilization: "", image: "52067dbd.Image.120450.jpg" },
  { ownerId: "7ac9828f", name: "เอ็ดเวิร์ด", species: "แมว", breed: "เปอร์เซีย", birth: "2/8/2024", color: "ส้ม", sex: "ผู้", sterilization: "", image: "7b820956.Image.112029.jpg" },
  { ownerId: "a17c0b62", name: "พายุ", species: "แมว", breed: "เปอร์เซีย", birth: "11/7/2023", color: "หินอ่อน", sex: "ผู้", sterilization: "", image: "03e270c8.Image.112204.jpg" },
  { ownerId: "3b8044ef", name: "เย็นเจี๊ยบ", species: "สุนัข", breed: "Pom", birth: "2/1/2021", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "e489f8d0.Image.141800.jpg" },
  { ownerId: "904b38cf", name: "โมชิ", species: "สุนัข", breed: "ปอม", birth: "6/10/2020", color: "ขาว", sex: "ผู้", sterilization: "", image: "e94761b2.Image.105157.jpg" },
  { ownerId: "613ad302", name: "นำโชค", species: "แมว", breed: "ไทย", birth: "10/17/2023", color: "สามสี", sex: "ผู้", sterilization: "", image: "e21a390a.Image.110529.jpg" },
  { ownerId: "b08c6d0b", name: "แพมมี่", species: "สุนัข", breed: "ไทย", birth: "7/13/2022", color: "ขาว น้ำตาล", sex: "เมีย", sterilization: "", image: "766e52b6.Image.115331.jpg" },
  { ownerId: "b4974b48", name: "มีตังค์", species: "สุนัข", breed: "ไทย", birth: "", color: "ดำ เทา", sex: "ผู้", sterilization: "", image: "6fb82449.Image.071236.jpg" },
  { ownerId: "167dca36", name: "บราว", species: "สุนัข", breed: "โกลเด้ล", birth: "7/19/2018", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "334f901a.Image.105228.jpg" },
  { ownerId: "865809de", name: "ชานม", species: "สุนัข", breed: "พุดเดิ้ล", birth: "7/6/2023", color: "ขาว", sex: "เมีย", sterilization: "", image: "34ea0336.Image.050226.jpg" },
  { ownerId: "865809de", name: "ชาเย็น", species: "สุนัข", breed: "พุดเดิ้ล", birth: "7/13/2023", color: "ขาว", sex: "เมีย", sterilization: "", image: "7a8b00b8.Image.050236.jpg" },
  { ownerId: "c6fdc9be", name: "ส้ม", species: "สุนัข", breed: "ปอม", birth: "4/17/2024", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "1a7d1d46.Image.064322.jpg" },
  { ownerId: "8610cda9", name: "ชาบู", species: "สุนัข", breed: "ไซบีเรียน", birth: "12/19/2024", color: "น้ำตาล ขาว", sex: "เมีย", sterilization: "", image: "e0019a13.Image.070540.jpg" },
  { ownerId: "b557a49f", name: "ออกัส", species: "แมว", breed: "เปอร์เซีย", birth: "7/15/2020", color: "เทา", sex: "ผู้", sterilization: "", image: "767fe86e.Image.102815.jpg" },
  { ownerId: "5e7293c5", name: "ข้าวหอม", species: "สุนัข", breed: "ปอม", birth: "11/17/2022", color: "ขาว", sex: "เมีย", sterilization: "", image: "132bc2d0.Image.120841.jpg" },
  { ownerId: "5e7293c5", name: "ตังค์", species: "สุนัข", breed: "ปอม", birth: "7/6/2022", color: "ขาว น้ำตาล", sex: "ผู้", sterilization: "", image: "03b4f39e.Image.120848.jpg" },
  { ownerId: "64dd19fd", name: "เชอลีน", species: "แมว", breed: "เปอร์เซีย", birth: "8/22/2024", color: "ส้มขาว", sex: "เมีย", sterilization: "", image: "ed13951f.Image.121031.jpg" },
  { ownerId: "476da4d3", name: "ชาพีช", species: "แมว", breed: "เปอร์เซีย", birth: "7/6/2023", color: "ขาว", sex: "ผู้", sterilization: "", image: "d76b343d.Image.124508.jpg" },
  { ownerId: "64ca032e", name: "ถ้วยฟู", species: "สุนัข", breed: "ปอม", birth: "", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "70c61022.Image.124626.jpg" },
  { ownerId: "59385e1b", name: "ฮะเก๋า", species: "แมว", breed: "ไทย", birth: "", color: "สลิด", sex: "ผู้", sterilization: "", image: "82c8339e.Image.110240.jpg" },
  { ownerId: "b4b8c8e5", name: "หมูหยอง", species: "สุนัข", breed: "พุดเดิ้ล", birth: "6/18/2008", color: "ขาว", sex: "เมีย", sterilization: "", image: "d53dc79e.Image.075809.jpg" },
  { ownerId: "35137862", name: "ลูฟี่", species: "แมว", breed: "เปอร์เซีย", birth: "11/17/2022", color: "ส้ม", sex: "ผู้", sterilization: "", image: "9f2cd9fc.Image.061836.jpg" },
  { ownerId: "a8ac8631", name: "ลูฟี่", species: "สุนัข", breed: "ไซ ผสม", birth: "12/21/2024", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "37ee9a13.Image.120300.jpg" },
  { ownerId: "21b609be", name: "ลูฟี่", species: "แมว", breed: "เปอร์เซีย", birth: "", color: "ขาว", sex: "ผู้", sterilization: "", image: "e19d68c4.Image.120242.jpg" },
  { ownerId: "59c4e5ff", name: "พุดซา", species: "สุนัข", breed: "ชิวาวา", birth: "7/13/2017", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "c364dd57.Image.035948.jpg" },
  { ownerId: "40ab981c", name: "เต้าหู้", species: "สุนัข", breed: "ปอม", birth: "6/15/2023", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "fe3c03c4.Image.095937.jpg" },
  { ownerId: "6ea2d16f", name: "พายุ", species: "แมว", breed: "สกอตติช", birth: "7/1/2024", color: "ขาว ดำ", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "3b99c8ff.Image.095538.jpg" },
  { ownerId: "f6882f4e", name: "ยูกิ", species: "แมว", breed: "ไทย", birth: "3/1/2021", color: "ขาว ลาย", sex: "ผู้", sterilization: "", image: "ea435d06.Image.114445.jpg" },
  { ownerId: "cc64e4be", name: "รถถัง", species: "สุนัข", breed: "ชิสุ", birth: "7/12/2023", color: "น้ำตาล ขาว", sex: "ผู้", sterilization: "", image: "f5219399.Image.105933.jpg" },
  { ownerId: "127c1e37", name: "ซิกกา", species: "แมว", breed: "", birth: "3/3/2019", color: "ขาว", sex: "เมีย", sterilization: "", image: "cf50ec60.Image.161910.jpg" },
  { ownerId: "127c1e37", name: "ฝิ่น", species: "แมว", breed: "", birth: "3/3/2020", color: "ขาว", sex: "ผู้", sterilization: "", image: "2ce587b5.Image.161957.jpg" },
  { ownerId: "127c1e37", name: "กัญชา", species: "แมว", breed: "", birth: "3/3/2017", color: "ดำ", sex: "ผู้", sterilization: "", image: "43e3a354.Image.162045.jpg" },
  { ownerId: "127c1e37", name: "กระท่อม", species: "แมว", breed: "เปอร์เซีย", birth: "3/3/2019", color: "ส้ม", sex: "ผู้", sterilization: "", image: "614a6e48.Image.162136.jpg" },
  { ownerId: "127c1e37", name: "มอฟิน", species: "แมว", breed: "", birth: "", color: "ส้ม", sex: "ผู้", sterilization: "", image: "81c58c4c.Image.162223.jpg" },
  { ownerId: "ef197740", name: "ลาเต้", species: "สุนัข", breed: "เฟรนบลูด๊อก", birth: "4/3/2024", color: "ครีม", sex: "ผู้", sterilization: "", image: "82f29b90.Image.114545.jpg" },
  { ownerId: "6728144f", name: "มายู", species: "แมว", breed: "เปอร์เซีย", birth: "7/13/2022", color: "ขาว", sex: "เมีย", sterilization: "", image: "3ae3a031.Image.090102.jpg" },
  { ownerId: "9953a157", name: "มีตังค์", species: "สุนัข", breed: "ผสม", birth: "6/13/2024", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "79218252.Image.092045.jpg" },
  { ownerId: "86414a5f", name: "แลมโบ", species: "สุนัข", breed: "ซามอย", birth: "7/14/2021", color: "ขาว", sex: "ผู้", sterilization: "", image: "286cc534.Image.112222.jpg" },
  { ownerId: "e7e4d6b4", name: "อดัม", species: "แมว", breed: "แมงคูณ", birth: "3/10/2021", color: "ลาย", sex: "ผู้", sterilization: "", image: "bb5cd901.Image.104044.jpg" },
  { ownerId: "3087b0c2", name: "ชัปปุย", species: "สุนัข", breed: "ปอม", birth: "7/9/2015", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "2b33bea8.Image.114737.jpg" },
  { ownerId: "c5d739bd", name: "ตังตัง", species: "สุนัข", breed: "ปอม", birth: "7/6/2017", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "c168a6be.Image.113014.jpg" },
  { ownerId: "9be05ba2", name: "เซฟเฟอร์", species: "สุนัข", breed: "พุดเดิ้ล", birth: "7/8/2010", color: "ขาว", sex: "ผู้", sterilization: "", image: "4bd63342.Image.113338.png" },
  { ownerId: "575da94c", name: "บีเอ็ม", species: "สุนัข", breed: "ไซบีเรียน", birth: "6/7/2022", color: "น้ำตาล ขาว", sex: "ผู้", sterilization: "", image: "b8b28556.Image.120645.jpg" },
  { ownerId: "54183555", name: "ทาโร่", species: "สุนัข", breed: "ไทย", birth: "7/14/2010", color: "ขาว", sex: "เมีย", sterilization: "", image: "8ff177a2.Image.120608.jpg" },
  { ownerId: "4b63990d", name: "แคนตาลูป", species: "แมว", breed: "เปอร์เซีย", birth: "2/14/2024", color: "ขาว", sex: "ผู้", sterilization: "", image: "ea8979ee.Image.131230.jpg" },
  { ownerId: "e3909452", name: "ยูโร", species: "สุนัข", breed: "ชิวาวา", birth: "", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "3eb2be29.Image.135722.jpg" },
  { ownerId: "e3909452", name: "หัวโต", species: "สุนัข", breed: "ชิวาวา", birth: "", color: "น้ำตาล ขาว", sex: "ผู้", sterilization: "", image: "fd999723.Image.135738.png" },
  { ownerId: "b071f2b1", name: "อังเปา", species: "สุนัข", breed: "ปอม", birth: "7/6/2021", color: "ขาว", sex: "ผู้", sterilization: "", image: "863b339b.Image.122724.jpg" },
  { ownerId: "433f6ffc", name: "อลิส", species: "สุนัข", breed: "ปอม", birth: "", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "ea7971ee.Image.085534.jpg" },
  { ownerId: "433f6ffc", name: "โบล่า", species: "สุนัข", breed: "ชิวาวา", birth: "", color: "ขาว", sex: "เมีย", sterilization: "", image: "4c7bc875.Image.085606.jpg" },
  { ownerId: "16bba394", name: "ปลาทู", species: "แมว", breed: "ไทย", birth: "7/6/2023", color: "ขาว", sex: "ผู้", sterilization: "", image: "1c6144dd.Image.140637.jpg" },
  { ownerId: "b29309ee", name: "เอ็ดเวิร์ด", species: "แมว", breed: "", birth: "", color: "ส้ม", sex: "ผู้", sterilization: "", image: "b2d7fac7.Image.140652.jpg" },
  { ownerId: "52a16f11", name: "หมีเนย", species: "สุนัข", breed: "ปอม", birth: "", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "159acce8.Image.142419.png" },
  { ownerId: "536d67e0", name: "ไอโก๊ะ", species: "สุนัข", breed: "ปอม", birth: "6/17/2021", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "29b3a98c.Image.070712.jpg" },
  { ownerId: "40080274", name: "ดอบบี้", species: "สุนัข", breed: "ชิวาวา", birth: "11/17/2022", color: "ดำ น้ำตาล", sex: "ผู้", sterilization: "", image: "a264840d.Image.054636.jpg" },
  { ownerId: "29143136", name: "นับเงิน", species: "สุนัข", breed: "สนาวเซอร์", birth: "", color: "ขาว", sex: "ผู้", sterilization: "", image: "299f5135.Image.083340.jpg" },
  { ownerId: "29143136", name: "นับดาว", species: "สุนัข", breed: "", birth: "", color: "ดำ", sex: "ผู้", sterilization: "", image: "1d949a7d.Image.111143.jpg" },
  { ownerId: "29143136", name: "นับเดือน", species: "สุนัข", breed: "", birth: "", color: "ดำ", sex: "ผู้", sterilization: "", image: "3f19e333.Image.111208.jpg" },
  { ownerId: "d8321c55", name: "ไข่ตุ๋น", species: "แมว", breed: "เปอร์เซีย", birth: "", color: "เทา", sex: "ผู้", sterilization: "", image: "45a02ea9.Image.112138.jpg" },
  { ownerId: "9835ef81", name: "แพนด้า", species: "สุนัข", breed: "ไทย", birth: "12/19/2024", color: "ขาว ดำ", sex: "ผู้", sterilization: "", image: "39e79d0b.Image.103448.jpg" },
  { ownerId: "cd28d79f", name: "มะขาม", species: "สุนัข", breed: "ไทย", birth: "12/11/2024", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "803440ff.Image.111738.jpg" },
  { ownerId: "bb955e34", name: "ซูกัส", species: "สุนัข", breed: "ไทย", birth: "7/7/2022", color: "น้ำตาล", sex: "ผู้", sterilization: "", image: "554da7b8.Image.111523.jpg" },
  { ownerId: "e193f07e", name: "แพนด้า", species: "แมว", breed: "", birth: "", color: "ขาว ดำ", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "28ea61cf.Image.120807.jpg" },
  { ownerId: "3855bf12", name: "ชินจัง", species: "แมว", breed: "", birth: "", color: "ขาว ดำ", sex: "เมีย", sterilization: "", image: "c1ed56ac.Image.060254.png" },
  { ownerId: "2e319c7b", name: "มะลิ", species: "สุนัข", breed: "", birth: "", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "12fb5a96.Image.111934.jpg" },
  { ownerId: "2e319c7b", name: "มะนาว", species: "สุนัข", breed: "", birth: "", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "f25552ab.Image.111955.jpg" },
  { ownerId: "b08c6d0b", name: "ไทก้า", species: "สุนัข", breed: "ไทย", birth: "1/2/2025", color: "ขาว", sex: "ผู้", sterilization: "", image: "fff3a8dc.Image.120537.jpg" },
  { ownerId: "d3a17915", name: "กี้", species: "สุนัข", breed: "", birth: "", color: "ดำ", sex: "เมีย", sterilization: "", image: "d1173b19.Image.113604.jpg" },
  { ownerId: "f037ade3", name: "ออกัส", species: "แมว", breed: "", birth: "", color: "ส้ม", sex: "ผู้", sterilization: "", image: "04ef1261.Image.113516.jpg" },
  { ownerId: "b5d6bc8b", name: "โนอา", species: "แมว", breed: "เปอร์เซีย", birth: "", color: "ลาย", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "e9b2cb10.Image.113737.jpg" },
  { ownerId: "b5d6bc8b", name: "หมาไซ", species: "สุนัข", breed: "ไซบีเรียน", birth: "12/19/2024", color: "ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "492b45aa.Image.113723.jpg" },
  { ownerId: "76d835c2", name: "สยาม", species: "สุนัข", breed: "ปอม", birth: "7/9/2020", color: "ดำ", sex: "ผู้", sterilization: "", image: "c372aa88.Image.120613.jpg" },
  { ownerId: "059179c9", name: "ข้าวจี่", species: "สุนัข", breed: "บาลาดอ", birth: "6/25/2024", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "93d22a28.Image.063134.jpg" },
  { ownerId: "37b256f4", name: "หมูตุ๋น", species: "สุนัข", breed: "เฟรนบลูดอก", birth: "6/6/2023", color: "ขาว", sex: "ผู้", sterilization: "", image: "e7c2980e.Image.092102.jpg" },
  { ownerId: "d1106fec", name: "แลมโบ", species: "สุนัข", breed: "ปอม", birth: "", color: "ขาว", sex: "ผู้", sterilization: "", image: "dabb679c.Image.124133.jpg" },
  { ownerId: "d1106fec", name: "มีตังค์", species: "สุนัข", breed: "ชิวาวา", birth: "", color: "น้ำตาล", sex: "เมีย", sterilization: "", image: "43ff83c2.Image.124655.jpg" },
  { ownerId: "d1106fec", name: "บีเอ็ม", species: "สุนัข", breed: "ปอม", birth: "", color: "ขาว", sex: "ผู้", sterilization: "", image: "80a78462.Image.124153.jpg" },
  { ownerId: "d1106fec", name: "ฮารุ", species: "สุนัข", breed: "ปอม", birth: "", color: "ขาว", sex: "เมีย", sterilization: "", image: "7c9df183.Image.124229.jpg" },
  { ownerId: "d1106fec", name: "เบนลี่", species: "สุนัข", breed: "ปอม", birth: "", color: "ขาว", sex: "ผู้", sterilization: "", image: "cf9742f1.Image.124210.jpg" },
  { ownerId: "d1106fec", name: "อาฟู่", species: "สุนัข", breed: "ปอม", birth: "", color: "ขาว", sex: "ผู้", sterilization: "", image: "902b3991.Image.124426.jpg" },
  { ownerId: "e6564c17", name: "ข้าวจ้าว", species: "แมว", breed: "ไทย", birth: "7/12/2022", color: "ขาว", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "7ac7944d.Image.114232.jpg" },
  { ownerId: "e94d9b52", name: "แบทแมน", species: "แมว", breed: "เปอร์เซีย", birth: "11/16/2022", color: "ขาว ดำ", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "e3a6ff15.Image.090431.jpg" },
  { ownerId: "55402d49", name: "ไมโล", species: "สุนัข", breed: "พุดเดิ้ล", birth: "", color: "น้ำตาล", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "27c23e78.Image.090813.jpg" },
  { ownerId: "55402d49", name: "เฮงเฮง", species: "สุนัข", breed: "พุดเดิ้ล", birth: "", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "3dc2ce2e.Image.090836.jpg" },
  { ownerId: "26c17eba", name: "คนสวย", species: "สุนัข", breed: "ชิวาวา", birth: "7/8/2015", color: "ขาว น้ำตาล", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "2b585ec8.Image.103004.jpg" },
  { ownerId: "1ec73982", name: "หมี่ขาว", species: "แมว", breed: "ไทย", birth: "1/8/2025", color: "ขาว", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "871df69f.Image.131311.jpg" },
  { ownerId: "fbf5efd0", name: "ดอปบี้", species: "แมว", breed: "ผสม", birth: "7/13/2023", color: "ดำ", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "171ce1f8.Image.043849.jpg" },
  { ownerId: "e323b2a1", name: "ชาบู", species: "สุนัข", breed: "โกลเด้น", birth: "6/6/2023", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "a748c89d.Image.083226.jpg" },
  { ownerId: "e78a18d3", name: "โจอี้", species: "สุนัข", breed: "ไซบีเรียน", birth: "7/5/2023", color: "ขาว ดำ", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "db79351d.Image.121606.jpg" },
  { ownerId: "3d64d2f6", name: "ยูริ", species: "แมว", breed: "ไทย", birth: "1/22/2025", color: "สามสี", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "9eefbd83.Image.121622.jpg" },
  { ownerId: "77fdf01c", name: "เต้าหู้", species: "สุนัข", breed: "", birth: "", color: "ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "659ceed0.Image.121745.jpg" },
  { ownerId: "bd403e41", name: "แครอท", species: "แมว", breed: "ไทย", birth: "1/15/2025", color: "ส้ม", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "b6ef6564.Image.060306.jpg" },
  { ownerId: "73049778", name: "ข้าวปุ้น", species: "สุนัข", breed: "ปอม", birth: "7/10/2019", color: "น้ำตาล", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "f371534c.Image.055705.jpg" },
  { ownerId: "4379b6d1", name: "คูเปอร์", species: "สุนัข", breed: "ปอม", birth: "3/1/2025", color: "ขาว", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "45efb95c.Image.055737.jpg" },
  { ownerId: "b804682f", name: "ออนลี่", species: "แมว", breed: "เปอร์เซีย", birth: "6/5/2018", color: "ขาว", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "5800b33a.Image.055905.jpg" },
  { ownerId: "bf323ec2", name: "เลอะเทอะ", species: "แมว", breed: "ผสม", birth: "3/22/2025", color: "สามสี", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "06f5f1b0.Image.125358.jpg" },
  { ownerId: "af44d818", name: "อังเปา", species: "สุนัข", breed: "ปอม", birth: "7/16/2020", color: "น้ำตาล", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "c2034af8.Image.055531.jpg" },
  { ownerId: "639fc869", name: "ป๊อกกี้", species: "สุนัข", breed: "ชิสุ", birth: "6/17/2015", color: "ขาว น้ำตาล", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "bd768c07.Image.050040.jpg" },
  { ownerId: "f4992512", name: "ใจฟู", species: "แมว", breed: "เปอร์เซีย", birth: "2/14/2025", color: "ส้ม", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "6932d8df.Image.060049.jpg" },
  { ownerId: "83e0f685", name: "ส้ม", species: "แมว", breed: "", birth: "", color: "ส้ม", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "1141a223.Image.060235.png" },
  { ownerId: "afef841b", name: "ออมสิน", species: "สุนัข", breed: "ชิวาวา", birth: "3/24/2017", color: "ครีม", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "593b3e0e.Image.120054.png" },
  { ownerId: "cb4198db", name: "แพนเตอร์", species: "แมว", breed: "สกอติช", birth: "", color: "น้ำตาล", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "b2dbbc31.Image.120410.jpg" },
  { ownerId: "d6da84b1", name: "ลัคกี้", species: "สุนัข", breed: "ปอม", birth: "", color: "ขาว", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "f8c8f491.Image.120607.jpg" },
  { ownerId: "11cf8ab1", name: "ไอติม", species: "แมว", breed: "ไทย", birth: "2/14/2025", color: "ส้ม ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "92d7bdcf.Image.080143.jpg" },
  { ownerId: "05a3d730", name: "ซูชิ", species: "สุนัข", breed: "ปอม", birth: "4/10/2025", color: "ขาว", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "00d38f7b.Image.074743.jpg" },
  { ownerId: "6d81f1e5", name: "คูเปอร์", species: "แมว", breed: "เปอร์เซีย", birth: "4/10/2025", color: "เทา", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "f45eaed4.Image.075032.jpg" },
  { ownerId: "b5d6bc8b", name: "เทียนเทียน", species: "แมว", breed: "", birth: "", color: "ลาย", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "33f69131.Image.103019.png" },
  { ownerId: "9b578b6d", name: "ชูก้า", species: "แมว", breed: "ไทย", birth: "4/2/2025", color: "ลาย", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "3898047e.Image.123433.jpg" },
  { ownerId: "9b578b6d", name: "ลูโค่", species: "แมว", breed: "ไทย", birth: "2/13/2025", color: "ลาย", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "187e0e45.Image.123416.jpg" },
  { ownerId: "05f1f71d", name: "พะโล้", species: "สุนัข", breed: "โกลเด้น", birth: "5/7/2025", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "405d18b2.Image.102022.jpg" },
  { ownerId: "2b6a48e9", name: "อังเปา", species: "สุนัข", breed: "ปอม", birth: "", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "475b8121.Image.060837.jpg" },
  { ownerId: "6067c9dc", name: "ถุงเท้า", species: "สุนัข", breed: "ปอม", birth: "7/12/2023", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "0dc45dd9.Image.123129.jpg" },
  { ownerId: "d314a4c6", name: "แซมมี่", species: "สุนัข", breed: "ปอม", birth: "7/19/2020", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "8f5e7cca.Image.033732.jpg" },
  { ownerId: "64c5564a", name: "ไข่ต้ม", species: "แมว", breed: "เปอร์เซีย", birth: "", color: "ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "6a3f9ccd.Image.102932.jpg" },
  { ownerId: "64c5564a", name: "ไข่ตุ๋น", species: "แมว", breed: "", birth: "", color: "ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "24f32bf3.Image.102947.jpg" },
  { ownerId: "839a6e43", name: "ชาบู", species: "สุนัข", breed: "บีเกิ้ล", birth: "", color: "น้ำตาล ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "d1557bb6.Image.102813.jpg" },
  { ownerId: "839a6e43", name: "โอ๋", species: "สุนัข", breed: "ชิวาวา", birth: "", color: "น้ำตาล", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "da03bb10.Image.102752.jpg" },
  { ownerId: "f43ffd7a", name: "อาเนีย", species: "แมว", breed: "เปอร์เซีย", birth: "", color: "ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "dbe646a5", name: "เต้าหู้", species: "แมว", breed: "วิเชียมาศ", birth: "5/15/2025", color: "ครีม ดำ", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "4acbf81a.Image.122112.jpg" },
  { ownerId: "ce7193eb", name: "ไอมอน", species: "แมว", breed: "เปอร์เซีย", birth: "6/7/2023", color: "ขาว ดำ", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "82d3d53d.Image.081030.jpg" },
  { ownerId: "cda9c1ba", name: "ดุ๊กดิ๊ก", species: "สุนัข", breed: "ชิวาวา ชิสุ", birth: "", color: "ขาว น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "3ec90706.Image.112129.jpg" },
  { ownerId: "ca8f055f", name: "ชอปเปอร์", species: "สุนัข", breed: "ชิวาว่า", birth: "5/4/2025", color: "สีเมอ", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "312a829c.Image.103316.jpg" },
  { ownerId: "a59e633b", name: "ริชชี่", species: "สุนัข", breed: "โกลเด้ล", birth: "6/12/2025", color: "น้ำตาล", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "d4ab50bd.Image.105210.jpg" },
  { ownerId: "c2d7cdf0", name: "ลาล้า", species: "สุนัข", breed: "พุดเดิ้ล", birth: "6/11/2013", color: "น้ำตาล", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "26b4f589.Image.105107.jpg" },
  { ownerId: "c2d7cdf0", name: "ปูเล้", species: "สุนัข", breed: "", birth: "6/13/2018", color: "ขาว", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "7d101bcc.Image.105046.jpg" },
  { ownerId: "e4e7c5db", name: "ไต้หวัน", species: "แมว", breed: "สกอติช", birth: "3/14/2024", color: "ส้ม", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "c29d9b87.Image.065931.jpg" },
  { ownerId: "bfb6b911", name: "ดอลล่า", species: "สุนัข", breed: "ลาบอดอ", birth: "7/16/2025", color: "น้ำตาล", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "36fbc960.Image.123426.jpg" },
  { ownerId: "4501cfff", name: "ไฟแนนซ์", species: "แมว", breed: "ผสม", birth: "1/26/2025", color: "ขาว ส้ม", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "197a70f4.Image.122229.jpg" },
  { ownerId: "68163049", name: "ไชโย", species: "สุนัข", breed: "อเมกันบูลลี่", birth: "3/13/2024", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "46dd7793.Image.040120.jpg" },
  { ownerId: "0afa9af1", name: "ฮันนี่", species: "สุนัข", breed: "ปอม", birth: "8/9/2025", color: "น้ำตาล", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "6773b8f4", name: "แพนด้า", species: "สุนัข", breed: "เฟรนบลูดอก", birth: "8/7/2025", color: "ขาว ดำ", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "11cf8ab1", name: "มันนี่", species: "แมว", breed: "ไทย", birth: "8/17/2025", color: "ส้ม", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "24111f60.Image.054745.jpg" },
  { ownerId: "11cf8ab1", name: "ดิสนี่", species: "แมว", breed: "ไทย", birth: "8/17/2025", color: "ส้ม", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "1d730e9c.Image.054722.jpg" },
  { ownerId: "3da36fba", name: "ปลาส้ม", species: "แมว", breed: "ผสม", birth: "8/26/2025", color: "ส้ม", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "a74dc5c0.Image.105309.jpg" },
  { ownerId: "adbaefb2", name: "ชาร์โค", species: "แมว", breed: "มัลกิ้น", birth: "6/27/2025", color: "บลู", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "112f2abc.Image.102604.jpg" },
{ ownerId: "57941ef0", name: "ไข่ตุ๋น", species: "สุนัข", breed: "ชิวาวา", birth: "9/24/2025", color: "น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "47c642c3.Image.055552.jpg" },
  { ownerId: "c38f69c9", name: "ปูเล่", species: "สุนัข", breed: "ผสม", birth: "11/29/2015", color: "ขาว", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "ba0dd055.Image.065528.jpg" },
  { ownerId: "3beecd2f", name: "ซอลมอน", species: "แมว", breed: "เปอร์เซีย", birth: "7/13/2023", color: "ส้ม", sex: "ผู้", sterilization: "ทำหมันแล้ว", image: "c339da66.Image.072355.jpg" },
  { ownerId: "43ade72c", name: "เอลซ่า", species: "แมว", breed: "ผสม", birth: "9/27/2025", color: "ลาย เทา", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "3d102bb8", name: "โมจิ", species: "สุนัข", breed: "ชิวาวา", birth: "10/1/2025", color: "ขาว ส้ม", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "3d102bb8", name: "เคซี", species: "แมว", breed: "", birth: "7/12/2024", color: "ส้ม", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "cbe436c8", name: "คำแก้ว", species: "แมว", breed: "เปอร์เซีย", birth: "3/12/2020", color: "ส้ม ขาว", sex: "เมีย", sterilization: "ทำหมันแล้ว", image: "" },
  { ownerId: "e1395f4e", name: "ซีม่อน", species: "สุนัข", breed: "ชิวาว่า", birth: "10/6/2025", color: "ขาว น้ำตาล", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "15afca11.Image.094927.jpg" },
  { ownerId: "9e49ea57", name: "สามชั้น", species: "สุนัข", breed: "บีเกิ้ล", birth: "9/17/2025", color: "น้ำตาล ขาว", sex: "เมีย", sterilization: "ยังไม่ทำหมัน", image: "" },
  { ownerId: "89b1d2b7", name: "มอน", species: "แมว", breed: "ไทย", birth: "5/22/2025", color: "ส้ม", sex: "ผู้", sterilization: "ยังไม่ทำหมัน", image: "" }
];

export default function ImportPage() {
  const [status, setStatus] = useState<string>("พร้อม Import");
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const importOpdHistory = async () => {
    setIsLoading(true);
    setStatus("กำลังนำเข้าประวัติการรักษา...");

    try {
      const opdCollection = collection(db, "opd_records");
      const appointmentsCollection = collection(db, "appointments");
      let successCount = 0;
      let errorCount = 0;
      
      const batchOpd = writeBatch(db);
      const batchAppt = writeBatch(db);
      let batchCount = 0;

      for (const opd of OPD_DATA) {
        if (!opd.key) continue;
        
        const pet = PETS_DATA.find(p => p.image && p.image.startsWith(opd.petKey));
        if (!pet) {
          console.warn(`Pet not found for key: ${opd.petKey}`);
          errorCount++;
          continue;
        }
        
        const petId = `${pet.ownerId}_${pet.name}`;
        
        let dateStr = "";
        let timeStr = "";
        if (opd.timeStamp) {
          try {
            const [datePart, timePart] = opd.timeStamp.split(" ");
            const [m, d, y] = datePart.split("/");
            if (y && m && d) {
              dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            if (timePart) timeStr = timePart;
          } catch (e) {}
        }
        if (!dateStr) dateStr = new Date().toISOString().split("T")[0];

        const opdDocRef = doc(opdCollection, opd.key);
        batchOpd.set(opdDocRef, {
          petId: petId,
          date: dateStr,
          time: timeStr,
          treatmentType: opd.treatmentType || "-",
          weight: opd.weight || "-",
          diagnosis: opd.opdDetail || "-",
          notes: opd.opdDetail || "-",
          status: "เสร็จสิ้น",
          createdAt: new Date().toISOString()
        });
        batchCount++;

        if (opd.appointmentDate) {
          try {
            let apptDateStr = "";
            const [m, d, y] = opd.appointmentDate.split("/");
            if (y && m && d) {
              apptDateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            
            if (apptDateStr) {
              const apptDocRef = doc(appointmentsCollection);
              batchAppt.set(apptDocRef, {
                petId: petId,
                ownerId: pet.ownerId,
                date: apptDateStr,
                time: "10:00",
                type: opd.treatmentType || "ติดตามอาการ",
                reason: opd.appointmentDetail || "นัดหมายติดตามอาการ",
                status: "pending",
                createdAt: new Date().toISOString()
              });
              batchCount++;
            }
          } catch(e) {}
        }

        successCount++;
        if (batchCount > 400) {
          await batchOpd.commit();
          await batchAppt.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batchOpd.commit();
        await batchAppt.commit();
      }

      setStatus(`✅ นำเข้าประวัติการรักษาสำเร็จ ${successCount} รายการ (ไม่พบสัตว์เลี้ยง ${errorCount} รายการ)`);
    } catch (error: any) {
      console.error(error);
      setStatus("❌ เกิดข้อผิดพลาด: " + error.message);
    }
    setIsLoading(false);
  };

  const importOwners = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setStatus("กำลัง Import เจ้าของ...");
    addLog(`เริ่ม Import เจ้าของทั้งหมด ${OWNERS_DATA.length} รายการ`);

    const BATCH_SIZE = 400;
    let imported = 0;

    try {
      for (let i = 0; i < OWNERS_DATA.length; i += BATCH_SIZE) {
        const chunk = OWNERS_DATA.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const owner of chunk) {
          const ref = doc(db, "owners", owner.key);
          batch.set(ref, {
            name: owner.name,
            phone: owner.phone,
            createdAt: new Date().toISOString(),
          }, { merge: true });
        }

        await batch.commit();
        imported += chunk.length;
        setProgress(Math.round((imported / OWNERS_DATA.length) * 100));
        addLog(`✅ Batch สำเร็จ (${imported}/${OWNERS_DATA.length})`);
      }

      setStatus(`✅ Import เจ้าของเสร็จสิ้น! (${imported} รายการ)`);
      addLog(`🎉 Import เจ้าของเสร็จสมบูรณ์ทั้งหมด ${imported} รายการ`);
    } catch (error: any) {
      setStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const importPets = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setStatus("กำลัง Import สัตว์เลี้ยง...");
    addLog(`เริ่ม Import สัตว์เลี้ยงทั้งหมด ${PETS_DATA.length} รายการ`);

    const BATCH_SIZE = 400;
    let imported = 0;

    try {
      for (let i = 0; i < PETS_DATA.length; i += BATCH_SIZE) {
        const chunk = PETS_DATA.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const pet of chunk) {
          // Generate deterministic ID: ownerId_petName
          const safeName = pet.name.replace(/\s+/g, '_');
          const ref = doc(db, "pets", `${pet.ownerId}_${safeName}`);
          
          // Image URL format, matching how we will save it locally in public/images/pets/
          const imageUrl = pet.image ? `/images/pets/${pet.image}` : null;
          
          batch.set(ref, {
            ownerId: pet.ownerId,
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            birthDate: pet.birth,
            color: pet.color,
            sex: pet.sex,
            sterilization: pet.sterilization,
            imageUrl: imageUrl, // Added Image URL
            createdAt: new Date().toISOString(),
          });
        }

        await batch.commit();
        imported += chunk.length;
        setProgress(Math.round((imported / PETS_DATA.length) * 100));
        addLog(`✅ Batch สำเร็จ (${imported}/${PETS_DATA.length})`);
      }

      setStatus(`✅ Import สัตว์เลี้ยงเสร็จสิ้น! (${imported} รายการ)`);
      addLog(`🎉 Import สัตว์เลี้ยงเสร็จสมบูรณ์ทั้งหมด ${imported} รายการ`);
    } catch (error: any) {
      setStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearPets = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบข้อมูลสัตว์เลี้ยงทั้งหมด?")) return;
    
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setStatus("กำลังลบข้อมูลสัตว์เลี้ยง...");
    addLog(`เริ่มดึงข้อมูลสัตว์เลี้ยงเพื่อลบ...`);

    try {
      const petsSnap = await getDocs(collection(db, "pets"));
      const total = petsSnap.docs.length;
      addLog(`พบข้อมูลสัตว์เลี้ยง ${total} รายการ`);

      let deleted = 0;
      const BATCH_SIZE = 400;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = petsSnap.docs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const docSnap of chunk) {
          batch.delete(docSnap.ref);
        }

        await batch.commit();
        deleted += chunk.length;
        setProgress(Math.round((deleted / total) * 100));
        addLog(`✅ ลบสำเร็จ (${deleted}/${total})`);
      }

      setStatus(`✅ ลบสัตว์เลี้ยงเสร็จสิ้น! (${deleted} รายการ)`);
      addLog(`🎉 ลบข้อมูลสำเร็จทั้งหมด`);
    } catch (error: any) {
      setStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOpdAndAppointments = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    setStatus("กำลังลบ OPD และ นัดหมาย...");
    
    try {
      const opdSnap = await getDocs(collection(db, "opd_records"));
      const apptSnap = await getDocs(collection(db, "appointments"));
      
      let deleted = 0;
      const total = opdSnap.docs.length + apptSnap.docs.length;
      
      const BATCH_SIZE = 400;
      let batch = writeBatch(db);
      let count = 0;
      
      for (const docSnap of [...opdSnap.docs, ...apptSnap.docs]) {
        batch.delete(docSnap.ref);
        count++;
        deleted++;
        
        if (count >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
          setProgress(Math.round((deleted / total) * 100));
        }
      }
      
      if (count > 0) {
        await batch.commit();
        setProgress(100);
      }
      
      setStatus(`✅ ลบ OPD และนัดหมายเสร็จสิ้น! (${deleted} รายการ)`);
      addLog(`🎉 ลบข้อมูล OPD และนัดหมายสำเร็จ`);
    } catch (error: any) {
      setStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🔧 SmilePet Data Import</h1>
      <p className="text-gray-400 text-sm mb-6">นำเข้าข้อมูลเจ้าของและสัตว์เลี้ยงลง Firebase Firestore</p>

      {/* Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-1">
        <p className="text-sm text-gray-400">ข้อมูลพร้อม Import:</p>
        <p className="text-lg font-bold text-white">👤 เจ้าของ: {OWNERS_DATA.length} รายการ</p>
        <p className="text-lg font-bold text-white">🐾 สัตว์เลี้ยง: {PETS_DATA.length} รายการ</p>
        <p className="text-xs text-gray-500 mt-2">⚠️ กด Import เจ้าของก่อน แล้วค่อย Import สัตว์เลี้ยง</p>
      </div>

      {/* Import Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={importOwners}
          disabled={isRunning}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-colors"
        >
          {isRunning ? "⏳ กำลัง Import..." : "👤 Import เจ้าของ (Owners)"}
        </button>
        <button
          onClick={importPets}
          disabled={isRunning}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-colors"
        >
          {isRunning ? "⏳ กำลัง Import..." : "🐾 Import สัตว์เลี้ยง (Pets)"}
        </button>
        <button
          onClick={clearPets}
          disabled={isRunning}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-colors mt-4"
        >
          {isRunning ? "⏳ กำลังลบ..." : "🗑️ ลบข้อมูลสัตว์เลี้ยงทั้งหมด (เพื่อล้างข้อมูลที่ซ้ำ)"}
        </button>

        <button
          onClick={clearOpdAndAppointments}
          disabled={isRunning}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-colors mt-4"
        >
          {isRunning ? "⏳ กำลังลบ..." : "🗑️ ลบข้อมูล OPD & นัดหมายทั้งหมด"}
        </button>
        
        <hr className="my-6 border-gray-800" />
        
        <button
          onClick={importOpdHistory}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold text-sm transition-colors mt-4"
        >
          {isLoading ? "⏳ กำลังนำเข้าประวัติ..." : "💉 Import ประวัติการรักษา (OPD & นัดหมาย)"}
        </button>
      </div>

      {/* Progress */}
      {progress > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>ความคืบหน้า</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 mb-4">
        <p className="text-sm font-bold">{status}</p>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-60 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-2 font-bold">Log:</p>
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-gray-300 font-mono">{log}</p>
          ))}
        </div>
      )}
    </div>
  );
}
