/*
  Authors : initappz (Rahul Jograna)
  Website : https://initappz.com/
  App Name : HandyService CleanIT This App Template Source code is licensed as per the
  terms found in the Website https://initappz.com/license
  Copyright and Good Faith Purchasers © 2023-present initappz.
*/
import { Injectable, NgZone } from '@angular/core';
import { LoadingController, AlertController, ToastController, NavController, MenuController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { NavigationExtras, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  isLoading = false;
  offers: any[] = [
    {
      "title": "First-time client special",
      "desc": "These tags can be used to highlight special promotions or deals to attract customers and increase sales in a salon setting",
      "off": "20",
      "image": "assets/images/banners/1.png",
      "background": "#fcba03"
    },
    {
      "title": "Loyalty program",
      "desc": "These tags can be used to highlight special promotions or deals to attract customers and increase sales in a salon setting",
      "off": "30",
      "image": "assets/images/banners/2.png",
      "background": "#0f8013"
    },
    {
      "title": "Refer-a-friend discount",
      "desc": "These tags can be used to highlight special promotions or deals to attract customers and increase sales in a salon setting",
      "off": "10",
      "image": "assets/images/banners/3.png",
      "background": "#fc5603"
    },
    {
      "title": "Summer hair package",
      "desc": "These tags can be used to highlight special promotions or deals to attract customers and increase sales in a salon setting",
      "off": "40",
      "image": "assets/images/banners/4.png",
      "background": "#b3199b"
    },
    {
      "title": "Group booking deal",
      "desc": "These tags can be used to highlight special promotions or deals to attract customers and increase sales in a salon setting",
      "off": "50",
      "image": "assets/images/banners/5.png",
      "background": "#3103fc"
    },
    {
      "title": "Special occasion package",
      "desc": "These tags can be used to highlight special promotions or deals to attract customers and increase sales in a salon setting",
      "off": "60",
      "image": "assets/images/banners/6.png",
      "background": "#7d3127"
    },
  ];

  categoriesList: any[] = [
    {
      "name": "Cleaning",
      "image": "assets/images/categories/cleaner.png"
    },
    {
      "name": "Repairing",
      "image": "assets/images/categories/repair.png"
    },
    {
      "name": "Painting",
      "image": "assets/images/categories/paint-roller.png"
    },
    {
      "name": "Laundry",
      "image": "assets/images/categories/washing-machine.png"
    },
    {
      "name": "Appliance",
      "image": "assets/images/categories/vaccum-cleaner.png"
    },
    {
      "name": "Plumbing",
      "image": "assets/images/categories/plumber.png"
    },
    {
      "name": "Shifting",
      "image": "assets/images/categories/fast-delivery.png"
    },
    {
      "name": "Beauty",
      "image": "assets/images/categories/cosmetics.png"
    },
    {
      "name": "AC Repairing",
      "image": "assets/images/categories/air-conditioning.png"
    },
    {
      "name": "Vehicle",
      "image": "assets/images/categories/bigfoot.png"
    },
    {
      "name": "Electronics",
      "image": "assets/images/categories/circuit.png"
    },
    {
      "name": "Massage",
      "image": "assets/images/categories/head.png"
    },
  ];

  userList: any[] = [
    {
      "image": "assets/images/avatar/1.jpg",
      "name": "Richard G. Oneal",
      "service": "Drywall Installation",
      "price": "125.22",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/2.jpg",
      "name": "Floyd M. Helton",
      "service": "Fixture Replacement",
      "price": "253.66",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/3.jpg",
      "name": "Matthew M. Hernandez",
      "service": "Smart Home Upgrade Installation",
      "price": "563.99",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/4.jpg",
      "name": "Candice M. Coffey",
      "service": "Painting for the Interior and Exterior",
      "price": "525.77",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/5.jpg",
      "name": "Terrie R. Cobb",
      "service": "Power Washing",
      "price": "714.22",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/6.jpg",
      "name": "Clarissa C. Wentz",
      "service": "Tile Installation",
      "price": "951.33",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/7.jpg",
      "name": "Shirley J. Arnold",
      "service": "Window Repair",
      "price": "753.66",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/8.jpg",
      "name": "Jack R. Applegate",
      "service": "Small Appliance Repair",
      "price": "951.55",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/9.jpg",
      "name": "Anita T. Ross",
      "service": "Interior stain and paint",
      "price": "852.66",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/10.jpg",
      "name": "Dianna K. Wadley",
      "service": "Drywall repair",
      "price": "896.88",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/11.jpg",
      "name": "Rodney R. Ruddy",
      "service": "Plumbing",
      "price": "874.66",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/12.jpg",
      "name": "Deanna B. Mull",
      "service": "Electrical tasks",
      "price": "956.99",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/13.jpg",
      "name": "Michael C. Phelan",
      "service": "Window coverings",
      "price": "513.88",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/14.jpg",
      "name": "Lorraine S. Jones",
      "service": "Carpentry jobs",
      "price": "963.66",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/15.jpg",
      "name": "Philip J. Watson",
      "service": "Babyproofing",
      "price": "512.33",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/16.jpg",
      "name": "Patricia R. James",
      "service": "Tiling",
      "price": "953.44",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/17.jpg",
      "name": "Dena C. Fernandez",
      "service": "Winterization",
      "price": "745.99",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/18.jpg",
      "name": "Troy S. Gaines",
      "service": "Home upgrades",
      "price": "856.99",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/19.jpg",
      "name": "Robin K. Miller",
      "service": "Door Hardware",
      "price": "784.55",
      "rate": "4.8",
      "total_rate": "8,536"
    },
    {
      "image": "assets/images/avatar/20.jpg",
      "name": "Willie K. Rothermel",
      "service": "Gutter cleaning",
      "price": "963.88",
      "rate": "4.8",
      "total_rate": "8,536"
    },
  ];

  serviceList: any[] = [
    {
      "name": "Living Room",
      "quantity": 0
    },
    {
      "name": "Master Bedroom",
      "quantity": 0
    },
    {
      "name": "Bathroom",
      "quantity": 0
    },
    {
      "name": "Laundry Room",
      "quantity": 0
    },
    {
      "name": "Guest Room",
      "quantity": 0
    },
    {
      "name": "Home Office",
      "quantity": 0
    },
    {
      "name": "Library",
      "quantity": 0
    },
    {
      "name": "Kids Bedroom",
      "quantity": 0
    },
    {
      "name": "Playroom",
      "quantity": 0
    },
    {
      "name": "Home Theatre Room",
      "quantity": 0
    },
    {
      "name": "Gym Room",
      "quantity": 0
    },
    {
      "name": "Basement",
      "quantity": 0
    },
    {
      "name": "Garage",
      "quantity": 0
    },
    {
      "name": "Walk-in Closet",
      "quantity": 0
    },
    {
      "name": "Pantry",
      "quantity": 0
    },
    {
      "name": "Gaming Room",
      "quantity": 0
    },
    {
      "name": "Attic",
      "quantity": 0
    },
    {
      "name": "Sunrooms",
      "quantity": 0
    },
    {
      "name": "Storage Room",
      "quantity": 0
    },
    {
      "name": "Music Room",
      "quantity": 0
    },
    {
      "name": "Wine Cellar",
      "quantity": 0
    },
    {
      "name": "Conservatories",
      "quantity": 0
    },
  ];

  chatList: any[] = [
    {
      "from": "a",
      "message": "Hello there. Thanks for the follow. Did you notice, that I am an egg? A talking egg? Damn!😄😄"
    },
    {
      "from": "b",
      "message": "	😃	😃	😃Yeah that is crazy, but people can change their own picture and build their own Twitter conversation with this generator, so it does not matter that you are an egg",
    },
    {
      "from": "a",
      "message": "Thanks mate! Feel way better now. Oh, and guys, these messages will be removed once your add your own :-)"
    },
    {
      "from": "b",
      "message": "You can then edit a message by clicking on it. This way you can change the text, status (check marks) and time. You can also determine whether the message was sent by the sender (right) or receiver (left)."
    },
    {
      "from": "a",
      "message": "😀😀You can change the order of messages by dragging and dropping them."
    },
    {
      "from": "b",
      "message": "Finally, click  (top right) to download your fake chat as an image."
    },
    {
      "from": "a",
      "message": "😀😀Thanks mate! Feel way better now. Oh, and guys, these messages will be removed once your add your own :-)"
    },
    {
      "from": "b",
      "message": "You also have the facility to hide the header and footer if needed."
    },
    {
      "from": "a",
      "message": "😀😀😀Customize the clock time and battery percentage as per your satisfaction."
    },
    {
      "from": "b",
      "message": "Now, make all the required changes for Person 2 also."
    },
    {
      "from": "a",
      "message": "If satisfied, download the chat and share with all your close friends and relatives, and note their reactions."
    },
    {
      "from": "b",
      "message": "😀😀Privacy comes first. Our tool does not store any data or chats by keeping in mind the privacy of our users"
    },
    {
      "from": "a",
      "message": "😀😀😀😀Our android text generator tool has an easy-to-use interface for the ease of the users. Also, the results generated by our tool are fast and realistic"
    },
    {
      "from": "b",
      "message": "Message privately. End-to-end encryption and privacy controls. Stay connected. Message and call for free* around the world. Build community. Group conversations made simple. Express yourself. Say it with stickers, voice, GIFs and more. WhatsApp business. Reach your customers from anywhere."
    },
    {
      "from": "a",
      "message": "Send a single message to multiple people at once"
    },
    {
      "from": "b",
      "message": "You can now send messages in bold, italics or strikethrough too. Simply use the special characters before and after the words to get the formatting of your choice"
    },
    {
      "from": "a",
      "message": "If you want to know who you are chatting too much with on WhatsApp, you can find out by simply scrolling through the chat screen"
    }
  ];
  constructor(
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private menuCtrl: MenuController,
    private router: Router,
    private zone: NgZone,
  ) { }

  navigateToPage(routes: any, param?: NavigationExtras | undefined) {
    this.zone.run(() => {
      console.log(routes, param);
      this.router.navigate([routes], param);
    });
  }

  navigateToProduct(id: number, name: string) {
    this.zone.run(() => {
      this.router.navigate(['product-details', id, name]);
    });
  }

  navigateRoot(routes: any | string) {
    this.zone.run(() => {
      this.navCtrl.navigateRoot([routes]);
    });
  }

  getKeys(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      resolve(localStorage.getItem(key))
    });
  }

  clearKeys(key: string) {
    // this.storage.remove(key);
    localStorage.removeItem(key);
  }

  setKeys(key: string, value: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      resolve(localStorage.setItem(key, value));
    });
  }

  async show(msg?: string | null) {
    this.isLoading = true;
    return await this.loadingCtrl.create({
      cssClass: 'custom-loader',
      spinner: null,
      // message: msg && msg != '' && msg != null ? msg : '',
      // spinner: 'bubbles',
    }).then(a => {
      a.present().then(() => {
        //console.log('presented');
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async hide() {
    this.isLoading = false;
    return await this.loadingCtrl.dismiss().then(() => console.log('dismissed'));
  }

  /*
    Show Warning Alert Message
    param : msg = message to display
    Call this method to show Warning Alert,
    */
  async showWarningAlert(msg: any) {
    const alert = await this.alertCtrl.create({
      header: 'Warning',
      message: msg,
      buttons: ['OK']
    });

    await alert.present();
  }

  async showSimpleAlert(msg: any) {
    const alert = await this.alertCtrl.create({
      header: '',
      message: msg,
      buttons: ['OK']
    });

    await alert.present();
  }

  /*
   Show Error Alert Message
   param : msg = message to display
   Call this method to show Error Alert,
   */
  async showErrorAlert(msg: any) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: msg,
      buttons: ['OK']
    });

    await alert.present();
  }

  /*
     param : email = email to verify
     Call this method to get verify email
     */
  async getEmailFilter(email: string) {
    const emailfilter = /^[\w._-]+[+]?[\w._-]+@[\w.-]+\.[a-zA-Z]{2,6}$/;
    if (!(emailfilter.test(email))) {
      const alert = await this.alertCtrl.create({
        header: 'Warning',
        message: 'Please enter valid email',
        buttons: ['OK']
      });
      await alert.present();
      return false;
    } else {
      return true;
    }
  }


  /*
    Show Toast Message on Screen
     param : msg = message to display, color= background
     color of toast example dark,danger,light. position  = position of message example top,bottom
     Call this method to show toast message
     */

  async showToast(msg: any, colors: any, positon: any) {


    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: colors,
      position: positon
    });
    toast.present();
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
  async shoNotification(msg: any, colors: any, positon: any) {

    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 4000,
      color: colors,
      position: positon,
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
          handler: () => {
            // console.log('Cancel clicked');
          }
        }
      ]
    });
    toast.present();
    await Haptics.impact({ style: ImpactStyle.Medium });

  }

  async errorToast(msg: any, color?: string | (string & Record<never, never>) | undefined) {

    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color ? color : 'dark'
    });
    toast.present();
    await Haptics.impact({ style: ImpactStyle.Medium });

  }

  onBack() {
    this.navCtrl.back();
  }

  makeid(length: any) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
