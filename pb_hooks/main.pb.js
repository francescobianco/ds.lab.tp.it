// pb_hooks/main.pb.js


routerAdd("GET", "/hello/:name", (c) => {
    let name = c.pathParam("name")

    return c.json(200, { "message": "Hello " + name })
}, $apis.requireRecordAuth('users'))

routerAdd("GET", "/:organization/:data_source/:action", (c) => {
    let dataSource = c.pathParam("data_source")
    let action = c.pathParam("action")
    let organization = c.pathParam("organization")

    return c.json(200, { "message": "Hello " + dataSource + organization + action })
}, $apis.requireRecordAuth('users'))



routerAdd("get", "/login", (c) => {
    const record = c.get("authRecord")
    let hide_form = (record!=null);
    let auth_txt = "Authorize"
    if (hide_form){
        auth_txt="Welcome "+record.get("username")
    }
    const html = $template.loadFiles(
        `${__hooks}/views/base/layout.html`,
        `${__hooks}/views/base/header.html`,
        `${__hooks}/views/base/footer.html`,
        `${__hooks}/views/auth/login_page.html`,
    ).render({
        "tittle":auth_txt,
        "hide_form":hide_form,
        "authorized":hide_form,
    })

    return c.html(200, html)
})

routerAdd("post", "/login", (c) => {
    const record = c.get("authRecord")
    let hide_form = (record!=null);
    let auth_txt = "Authorize"
    if (hide_form){
        auth_txt="Welcome "+record.get("username")
    }
    try {
        const users = $app.dao().findCollectionByNameOrId("users")

        const form = new RecordPasswordLoginForm($app, users);

        c.bind(form);
        // this will perform validation and will try to find an auth record matching the submitted credentials
        const authRecord = form.submit();

        const token = $tokens.recordAuthToken($app, authRecord)
        auth_txt="Welcome "+authRecord.get("username")

        const rawCookie = `pb_auth=${token}; Max-Age=${$app.settings().recordAuthToken.duration}; Path=/; SameSite=Strict; Secure; HttpOnly`;

        c.response().header().add("Set-Cookie", rawCookie);
        hide_form=true
    } catch (err) {
        // maybe redirect to an error page?
        //return c.redirect(400, "/error");
    }
    const html = $template.loadFiles(
        `${__hooks}/views/base/layout.html`,
        `${__hooks}/views/base/header.html`,
        `${__hooks}/views/base/footer.html`,
        `${__hooks}/views/auth/login_page.html`,
    ).render({
        "tittle":auth_txt,
        "hide_form":hide_form,
        "authorized":hide_form,
    })

    return c.html(200, html)
})

routerAdd("get", "/signout", (c) => {
    try {
        const rawCookie = `pb_auth=""; Max-Age=0; Path=/; SameSite=Strict; Secure; HttpOnly`;

        c.response().header().add("Set-Cookie", rawCookie);
    } catch (err) {
        return c.redirect(307, "/login");
    }

    return c.redirect(307, "/login");
})


// Registers a middleware that will try to load the current request
// record auth state from a cookie.
routerUse((next) => {
    return (c) => {
        try {
            const token = c.request().cookie("pb_auth")?.value

            if (token) {
                const record = $app.dao().findAuthRecordByToken(
                    token,
                    $app.settings().recordAuthToken.secret,
                )
                c.set("authRecord", record)
            }
        } catch(_) {}

        return next(c)
    }
})

// Hook to write a cookie to the response after authentication.
//
// Note: usually e.httpContext.setCookie(http.Cookie) should be used
// but the JSVM currently doesn't have bindings for the http.Cookie creation
// (I'll consider adding it with the next release),
// so instead we construct a raw cookie string and write it directly as response header.
onRecordAuthRequest((e) => {
    let rawCookie = `pb_auth=${e.token}; Max-Age=${$app.settings().recordAuthToken.duration}; Path=/; SameSite=Strict; Secure; HttpOnly`;

    e.httpContext.response().header().add("Set-Cookie", rawCookie);

    // ideally in the next release the above can be replaced with something like:
    // e.httpContext.setCookie(new Cookie({
    //     name:     "pb_auth",
    //     value:    e.token,
    //     secure:   true,
    //     sameSite: "Strict",
    //     httpOnly: true,
    //     maxAge:   $app.settings().recordAuthToken.duration,
    //     path:     "/",
    // }))
})







onModelAfterUpdate((e) => {
    console.log("user updated...", e.model.get("email"))
}, "users")

onRecordBeforeUpdateRequest((e) => {
   e.record.set('public_url', 'https://cavallo.it')
}, "data_sources")