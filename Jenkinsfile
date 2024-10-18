@Library('gwsLibrary') _

def componentName = "gws-ui-crmworkspace"
def componentDir = "projects/ui/${componentName}"
def buildNode = "jenkins-build-v3"
def testNode = "docker-vm11"
def testNode1 = "docker-vm15"


// String [] testSuits = [
//         "unit_tests_file_name_1:esx45-ip21-16.gws.genesys.com",
//         "unit_tests_file_name_2:esx45-ip21-16.gws.genesys.com"
// ]

String voiceMachine = "esx45-ip21-16.gws.genesys.com"

Map testJobs = ["gws-crm-workspace-test-1":"docker-vm11","gws-crm-workspace-chat-test":"docker-vm15"]

def componentPipeline = null

// Loading shared pipeline code:
node (buildNode) {
    checkout([$class : "MercurialSCM", clean: true, credentialsId: "gws-sys-camelot", installation: "Mercurial 3.3",
              subdir: "gws", source: "https://hg.gws.genesys.com/gws-microservices"])
    componentPipeline = load("gws/cd/component-pipeline/UiCrmWorkspacePipeline.groovy")
}

componentPipeline.runPipeline(componentName, componentDir, buildNode, voiceMachine, testJobs)