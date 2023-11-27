var parms = new URLSearchParams(new URL(window.location.href).searchParams);
var _name = parms.get('name');

kaboom();

var loggedInUID = "";

window.addEventListener('beforeunload', function (e) {
    firebase.database().ref('users/' + loggedInUID).remove();
})

// Define openGame function
function openGame() {
    setBackground(50, 139, 168);
    loadBean();
    setGravity(1600);

    const name = add([
        text(_name),
        pos(),
        anchor("center")
    ]);

    const localPlayer = add([
        sprite("bean"),
        pos(25,25),
        area(),
        body(),
        "localplr"
    ]);

    add([
        text("UID: " + loggedInUID),
        pos(25,25),
        lifespan(1, {fade: .5}),
        fadeIn(.5),
        color(BLACK),
        fixed(),
        opacity(0),
    ]);

    const ground = add([
        rect(10000, 696),
        pos(-400, 1000),
        area(),
        body({isStatic: true})
    ]);

    let good = true;

    localPlayer.onUpdate(() => {
        if (!good) {
            go("wrong");
            firebase.database().ref('users/' + loggedInUID).remove();
            return;
        }

        tween(camPos(), localPlayer.pos, .05, (p) => camPos(p), easings.easeInOutSine);
        name.pos = vec2(localPlayer.pos.x + (localPlayer.width/2), localPlayer.pos.y - 20);

        firebase.database().ref('users/' + loggedInUID).get().then((snap) => {
            if (!snap.exists() && good == true) {
                alert("Data deleted.");
                good = false;
            }
        })
        firebase.database().ref('users/' + loggedInUID).update({
            pos: { x: Math.round(localPlayer.pos.x), y: Math.round(localPlayer.pos.y) }
        })
    });

    onKeyDown("left", () => {
        localPlayer.pos.x -= 400 * dt();
    });
    onKeyDown("right", () => {
        localPlayer.pos.x += 400 * dt();
    });
    onKeyPress("up", () => {
        if (localPlayer.isGrounded()) {
            localPlayer.jump();
        }
    });
}

function user_listen(user) {
    var key = user.key;
    var childData = user.val();
    if (key == loggedInUID) { return }

    loadBean();

    const name = add([
        text(childData.username),
        pos()
    ]);

    const plr = add([
        sprite("bean"),
        pos(25, 25),
        area(),
        "otherplr"
    ]);

    plr.onUpdate(() => {
        name.pos = vec2(plr.pos.x - (plr.width / 2), plr.pos.y - 40);
    });

    firebase.database().ref('users/' + key + "/pos").on('value', (snap) => {
        if (snap == null || snap == undefined) {
            if (plr) {
                plr.destroy();
                name.destroy();
            }
            return
        }
        console.log(snap.val())
        if (snap.val() == null) {
            if (plr) {
                plr.destroy();
                name.destroy();
            }
            return
        }
        plr.pos = vec2(snap.val().x, snap.val().y);
    });
}

function connecting() {
    setBackground(BLACK);
    add([
        text("Connecting..."),
        pos(center()),
        anchor("center"),
        color(WHITE)
    ]);
}

function wrong() {
    setBackground(BLACK);
    add([
        text("Something went wrong."),
        pos(center()),
        anchor("center"),
        color(WHITE)
    ]);
}

function menu() {
    const text = add([
        pos(center()),
        text("...")
    ])
    const text_container = add([
        rect(200,50),
        pos(center())
    ])

    onCharInput((ch) => {
        text.text += ch;
    })
}

scene("game", openGame);
scene("connecting", connecting);
scene("wrong", wrong);
scene('menu', menu);

onLoad(() => {
    go("connecting");
    firebase.auth().signInAnonymously()
        .then(() => {
            go("menu");
        }).catch(() => {
            alert("Couldn't connect...");
        });
});

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        var uid = user.uid;
        loggedInUID = uid;
        firebase.database().ref('users/' + loggedInUID).set({
            username: _name,
            pos: { x: 0, y: 0 }
        });
        firebase.database().ref('users/').get().then((snapshot) => {
            console.log(snapshot);
            snapshot.forEach((user) => {
                user_listen(user);
            });
        });
        firebase.database().ref('users/').on('child_added', (snap) => {
            console.log(snap);
            user_listen(snap);
        })
    } else {
        // User is signed out
        // ...
        alert("User is signed out");
    }
});