if (window.Strings) {
    window.Strings.NEW_PROJECT = window.Strings.CREATE_PROJECT || "New Project";
    window.Strings.HELLO_WORLD = window.Strings.HELLO_WORLD || "Hello World";
}

function _openHomeTemplate(buttonId, zipPath, suggestedName, titleKey, previewPath) {
    const button = document.getElementById(buttonId);
    if (!button) {
        return;
    }

    button.onclick = function () {
        const title = Strings[titleKey] || titleKey;
        const options = {
            backURL: "code-editor.html"
        };

        if (previewPath) {
            options.previewURL = getWeaveAbsURL(previewPath);
        }

        if (buttonId !== "helloWorldBtn") {
            options.license = "MIT";
            options.licenseURL = "https://github.com/twbs/bootstrap/blob/main/LICENSE";
            options.credits = "https://getbootstrap.com/";
            options.creditsURL = "https://getbootstrap.com/";
        }

        Metrics.countEvent(Metrics.EVENT_TYPE.NEW_PROJECT, "main.Click", suggestedName);
        newProjectFromURLScreen(
            getWeaveAbsURL(zipPath),
            suggestedName,
            title,
            options
        );
    };
}

function initHomeProjectTemplates() {
    _openHomeTemplate(
        "helloWorldBtn",
        "assets/sample-projects/HTML5.zip",
        "hello-world",
        "HELLO_WORLD",
        "assets/sample-projects/HTML5/index.html"
    );
    _openHomeTemplate(
        "homePageBtn",
        "assets/sample-projects/home-pages.zip",
        "home-page",
        "WEBPAGE_HOME_PAGE",
        "assets/sample-projects/home-pages/carousel/index.html"
    );
    _openHomeTemplate(
        "blogPageBtn",
        "assets/sample-projects/bootstrap-blog.zip",
        "blog",
        "WEBPAGE_BLOG",
        "assets/sample-projects/bootstrap-blog/index.html"
    );
    _openHomeTemplate(
        "dashboardBtn",
        "assets/sample-projects/dashboard.zip",
        "dashboard",
        "WEBPAGE_DASHBOARD",
        "assets/sample-projects/dashboard/index.html"
    );
    _openHomeTemplate(
        "bootstrapExamplesBtn",
        "assets/sample-projects/zips/bootstrap.zip",
        "bootstrap-examples",
        "WEBPAGE_BOOTSTRAP_EXAMPLES"
    );

    document.getElementById("focusguard-2").onfocus = function () {
        document.getElementById("defaultProjectButton").focus();
    };
}
